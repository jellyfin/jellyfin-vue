/**
 * The runtime supervisors of the local playback. They only sample the media element and hls.js and act on what the
 * pure functions of the playback capability engine decide:
 * - failure ladder: the media element's error, a media error hls.js cannot recover from, no picture once the metadata
 * loaded, or no frame ever presented while the time advances, move one rung down (`playbackManager.reportPlaybackFailure`)
 * - smoothness: too many dropped frames move Automatic down; other modes get one warning per playback
 * - network (Automatic only): buffering stalls move it down, a margin of the network estimate sustained while playing
 * moves it up
 * Without hls.js (the element plays the server's HLS output natively, see `hls-delivery.ts`), its media errors reach the
 * failure ladder as the element's own, and there is no network estimate: Automatic only moves down on stalls.
 *
 * They also tell the playback manager once the playback works (`playbackManager.reportPlaybackWorked`): a hard failure
 * afterwards is about the file or the moment, not the browser. A source the element loads itself (a direct play, or
 * HLS played natively) that stops answering is a network error, not a codec failure: it is loaded again a bounded
 * number of times, then the playback stops with an error (see `onLoadTrouble`).
 */
import type Hls from 'hls.js';
import { ErrorDetails, Events, PlaylistLevelType, type BufferCodecsData, type FragBufferedData } from 'hls.js';
import { watch } from 'vue';
import { useEventListener, useIntervalFn } from '@vueuse/core';
import i18next from 'i18next';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { isDocumentVisible, mediaElementRef } from '#/store/index.ts';
import { getPlaybackPolicy } from '#/store/playback-capabilities.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import {
  getCurrentAutoState,
  playbackObservations,
  rememberRefusedAutoStep,
  sessionNetworkEstimate,
  setAutoState,
  type PlaybackChange,
  type PlaybackChangeReason,
  type RunningQuality
} from '#/store/playback-quality.ts';
import {
  DROPPED_FRAMES_CONSECUTIVE_WINDOWS,
  DROPPED_FRAMES_WINDOW_MS,
  HLS_MEDIA_ERROR_RECOVERIES,
  MEDIA_RESOURCE_CHECK_TIMEOUT_MS,
  NETWORK_LONG_STALL_MS,
  STARVED_BUFFER_AHEAD_S,
  SUPERVISOR_SAMPLE_MS
} from '#/utils/playback-capabilities/constants.ts';
import {
  getDownStep,
  getSmoothnessStep,
  getUpStep,
  isRefused,
  rememberStall,
  type AutoState
} from '#/utils/playback-capabilities/quality-auto.ts';
import {
  exceedsQuality,
  getDecodedVideo,
  getEncodedLevel,
  getModeLevel,
  getTranscodeLevel,
  type QualityLevel,
  type VideoInfo
} from '#/utils/playback-capabilities/quality.ts';
import {
  getBufferedAhead,
  isNotSmooth,
  NO_NETWORK_ATTEMPTS,
  startNetworkMemory,
  stepFrameProgress,
  stepNetwork,
  stepNetworkRecovery,
  type FrameProgress,
  type FrameWindow,
  type NetworkAttempts,
  type NetworkEvent,
  type NetworkMemory
} from '#/utils/playback-capabilities/runtime-signals.ts';

/**
 * What the supervisors remember about the source being played (one URL)
 */
interface SourceRun {
  url?: string;
  /**
   * Media errors hls.js was asked to recover from: at most {@link HLS_MEDIA_ERROR_RECOVERIES}
   */
  recoveries: number;
  /**
   * Whether a supervisor already acted on this source: the next source starts again, and so does this one when the
   * playback manager keeps the playback instead of the step of Automatic it asked for (see `pendingStep`)
   */
  acted: boolean;
  /**
   * The step of Automatic asked for on this source (for which playback, the state it moves to and the change the
   * statistics record once the new source starts), until then or until the playback manager keeps the playback instead
   */
  pendingStep?: { key: string; state: AutoState; change: PlaybackChange };
  /**
   * Whether hls.js buffered a fragment of this source, so its network estimate is current
   */
  measured: boolean;
  network: NetworkMemory;
  /**
   * Since the last load of the element (a recovery of hls.js reloads it too)
   */
  playing: boolean;
  /**
   * From a seek until the playback moves again: stalls then are caused by the seek
   */
  afterSeek: boolean;
  /**
   * Whether the seek that set `afterSeek` completed
   */
  seeked: boolean;
  /**
   * Whether hls.js announced that it moves the playhead itself (a nudge over a stall or a jump over a hole), so the
   * next seek is not the user's
   */
  hlsSeek: boolean;
  /**
   * When the current buffering stall started (see `trackStall`)
   */
  stallStartedAt?: number;
  /**
   * The previous sample's time and media time
   */
  lastSample?: { at: number; mediaTime: number };
  /**
   * Whether a video frame was presented since the element started loading (see `watchPresentedFrame`)
   */
  presented: boolean;
  /**
   * The element's frame counter when the load started: a count above it means this load decoded frames
   */
  framesAtLoad: number;
  frameProgress?: FrameProgress;
  window?: { start: number; total: number; dropped: number; valid: boolean };
  windows: FrameWindow[];
}

/**
 * What the supervisors remember about the loads of the source being played (one URL) for what a failure teaches and for
 * the element's network recovery
 */
interface LoadRun {
  url?: string;
  /**
   * Whether the playback was reported working (see the `timeupdate` listener), and for which streams: the signature of
   * the verdict it was negotiated with. A renegotiation can keep the URL and change the streams (another audio track of
   * a direct play), and what a failure teaches is decided by signature.
   */
  worked: boolean;
  workedAs?: string;
  /**
   * The media time the time advancing is measured from in this load, and the signature it was taken for: unset until the
   * element plays, after a seek, and when the streams change
   */
  advanceFrom?: number;
  advanceAs?: string;
  /**
   * The element's own load failures, as `stepNetworkRecovery` counts them, since the playback last got past the
   * position the last one happened at (`failedAt`)
   */
  attempts: NetworkAttempts;
  failedAt?: number;
  /**
   * Whether a new load of the recovery has not started playing yet: its own seeks (to where the playback was, and the
   * player's resume) are not the user's
   */
  reloading?: boolean;
  /**
   * Whether a load trouble is being handled: its check is in flight or its new load is scheduled
   */
  handling: boolean;
  timer?: ReturnType<typeof setTimeout>;
  /**
   * Since when the media time has not advanced while playing, with the time and the end of the buffer it is compared
   * with (see `watchStillTime`)
   */
  still?: { mediaTime: number; bufferedEnd: number; since: number };
}

/**
 * Playbacks (by key) that were already warned about not being smooth
 */
const warnedNotSmooth = new Set<string>();

/**
 * What a check of a source the element loads itself found (see {@link checkResource})
 */
type ResourceAnswer = 'answers' | 'fails' | 'unauthorized';

/**
 * Whether a source the media element loads itself answers: its first byte is asked for, like the element asks for
 * ranges (anonymous CORS, credentials only in the URL), and it answers only once that byte arrives: a connection that
 * stopped without closing can still send the headers of a new request and nothing more. No byte in
 * {@link MEDIA_RESOURCE_CHECK_TIMEOUT_MS}, a network error or an error status are `fails`; 401, the server refusing the
 * session, is `unauthorized`.
 */
async function checkResource(url: string): Promise<ResourceAnswer> {
  try {
    // The wait covers the headers and the first byte: aborting it also errors the body
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      cache: 'no-store',
      signal: AbortSignal.timeout(MEDIA_RESOURCE_CHECK_TIMEOUT_MS)
    });

    if (!response.ok) {
      void response.body?.cancel();

      return response.status === 401 ? 'unauthorized' : 'fails';
    }

    if (!response.body) {
      return 'answers';
    }

    const reader = response.body.getReader();
    const { value } = await reader.read();

    void reader.cancel();

    return value && value.byteLength > 0 ? 'answers' : 'fails';
  } catch {
    return 'fails';
  }
}

/**
 * Where the element's buffer ends: the end of its last buffered range (0 when nothing is buffered)
 */
function getBufferedEnd(el: HTMLMediaElement): number {
  const { buffered } = el;

  return buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
}

/**
 * A new run for a source
 */
function newRun(url?: string): SourceRun {
  return {
    url, recoveries: 0, acted: false, measured: false, network: startNetworkMemory(performance.now()),
    playing: false, afterSeek: false, seeked: false, hlsSeek: false, presented: false, framesAtLoad: 0, windows: []
  };
}

/**
 * The menu entry a state of Automatic aims at, to describe a change of quality
 */
function getTargetEntry(state: AutoState, video: VideoInfo): RunningQuality {
  return state.encodeVideo || exceedsQuality(video, { type: 'auto', level: state.level })
    ? getTranscodeLevel(video, state.level)
    : 'original';
}

/**
 * Starts the runtime supervisors for the player's lifetime
 *
 * @param hls - The player's hls.js instance, when hls.js plays the server's HLS output here
 * @returns `startSource`, to call whenever the player loads a new URL (or none), and `onHlsMediaError`, to call for
 * a fatal media error of hls.js that is not a codec error
 */
export function usePlaybackSupervisors(hls: Hls | undefined) {
  let run = newRun();
  let loadRun: LoadRun = { worked: false, attempts: NO_NETWORK_ATTEMPTS, handling: false };

  // The network estimate is remembered for the session: a new player starts from it
  if (hls && sessionNetworkEstimate.value) {
    hls.bandwidthEstimate = sessionNetworkEstimate.value;
  }

  /**
   * Hands a hard failure to the playback manager, once per source
   */
  const fail = (reason: PlaybackChangeReason): void => {
    if (run.acted) {
      return;
    }

    run.acted = true;
    void playbackManager.reportPlaybackFailure(reason);
  };

  /**
   * The video stream, the state of Automatic and, when the video is encoded, the level asked for and the level it is
   * decoded at (the server can encode below what was asked, see `getEncodedLevel`), when the current playback is in
   * Automatic and has video. Moving up starts from what was asked, so it never asks for the same stream again; moving
   * down starts from what plays, so it never asks for the same output again.
   */
  const getAutoContext = () => {
    const key = playbackManager.currentPlaybackKey.value;
    const mode = playbackManager.currentQualityMode.value;
    const video = playbackManager.currentPlayingVideoStream.value;

    if (!key || mode?.type !== 'auto' || !video) {
      return;
    }

    const size = playbackObservations.videoSize.value;
    const encoded = playbackManager.currentPlaybackMethod.value === 'TranscodeVideo';
    const askedAt: QualityLevel | undefined = encoded ? getTranscodeLevel(video, getModeLevel(mode)) : undefined;
    const encodedAt: QualityLevel | undefined = encoded
      ? getEncodedLevel(video, getModeLevel(mode), getDecodedVideo(size))
      : undefined;

    /**
     * Every step down encodes the video: the user's policy may forbid it, and the manager would refuse the step
     */
    const mayEncodeVideo = getPlaybackPolicy().EnableVideoPlaybackTranscoding !== false;

    return { key, video, askedAt, encodedAt, mayEncodeVideo, state: getCurrentAutoState(key) };
  };

  /**
   * Moves Automatic to another state, once per source, unless the playback manager refused that step recently (see
   * `rememberRefusal`). The statistics record the change once the new source starts.
   */
  const moveAuto = (context: NonNullable<ReturnType<typeof getAutoContext>>, state: AutoState, reason: PlaybackChangeReason): void => {
    if (isRefused(context.state, state, performance.now())) {
      return;
    }

    run.acted = true;
    run.pendingStep = {
      key: context.key,
      state,
      change: {
        kind: 'quality',
        reason,
        from: playbackManager.currentRunningQuality.value ?? 'original',
        to: getTargetEntry(state, context.video),
        at: Date.now()
      }
    };
    setAutoState(context.key, state);
  };

  /**
   * The playback manager kept the playback instead of the step of Automatic asked for on this source (it gave nothing
   * playable, or no answer; see `playbackManager.lastImprovement`), or took it with the URL already playing: the
   * supervisors act on the playback again, the network supervisor starting its memory again (as after a change), and
   * nothing changed for the statistics. A step that gave nothing playable is remembered, so it is not asked for again
   * and again (see `rememberRefusal`).
   */
  watch(() => playbackManager.lastImprovement.value, (improvement) => {
    const step = run.pendingStep;

    if (!improvement || step?.key !== improvement.key) {
      return;
    }

    if (improvement.outcome === 'applied') {
      // The new source starts a new run, unless the answer has the URL already playing (nothing is reloaded)
      if (playbackManager.currentSourceUrl.value !== run.url) {
        return;
      }
    } else if (improvement.outcome === 'refused') {
      rememberRefusedAutoStep(step.key, step.state);
    }

    Object.assign(run, { acted: false, pendingStep: undefined, network: startNetworkMemory(performance.now()), window: undefined, windows: [] });
  });

  /**
   * The playback is not smooth: Automatic moves down, other modes are warned once per playback
   */
  const onNotSmooth = (): void => {
    const key = playbackManager.currentPlaybackKey.value;
    const context = getAutoContext();

    if (context) {
      const next = getSmoothnessStep(context.state, context.video, context.encodedAt, context.mayEncodeVideo);

      if (next) {
        moveAuto(context, next, 'notSmooth');
      }
    } else if (key && !warnedNotSmooth.has(key) && playbackManager.currentQualityMode.value?.type !== 'auto') {
      warnedNotSmooth.add(key);
      useSnackbar(i18next.t('playbackNotSmooth'), 'warning');
    }
  };

  /**
   * Feeds the network supervisor (Automatic only) and acts on its decision
   */
  const onNetworkEvent = (event: NetworkEvent): void => {
    const context = getAutoContext();

    if (!context || run.acted) {
      return;
    }

    const result = stepNetwork(run.network, event);

    run.network = result.memory;

    if (result.decision === 'down') {
      const next = getDownStep(
        context.state,
        context.video,
        context.encodedAt,
        run.measured ? sessionNetworkEstimate.value : undefined,
        context.mayEncodeVideo
      );

      if (next) {
        moveAuto(context, rememberStall(context.state, next, context.askedAt, event.at), 'networkDown');
      }
    } else if (result.decision === 'up') {
      const next = getUpStep(context.state, context.video, context.askedAt, event.at)?.state;

      if (next) {
        moveAuto(context, next, 'networkUp');
      }
    }
  };

  /**
   * Whether the current playback expects a picture: a video item negotiated with a video stream
   */
  const expectsVideo = (el: HTMLMediaElement): el is HTMLVideoElement =>
    el instanceof HTMLVideoElement && playbackManager.currentVerdict.value?.video !== undefined;

  /**
   * A media error of the element or of hls.js: hls.js is asked to recover {@link HLS_MEDIA_ERROR_RECOVERIES} times, then it is a hard failure
   */
  const onMediaError = (): void => {
    if (hls?.media && hls.media === mediaElementRef.value && run.recoveries < HLS_MEDIA_ERROR_RECOVERIES) {
      run.recoveries++;
      useSnackbar(i18next.t('mediaError'), 'error');
      hls.recoverMediaError();
    } else {
      fail(hls?.media && hls.media === mediaElementRef.value ? 'hlsMediaError' : 'mediaError');
    }
  };

  /**
   * Feeds the frame counters to the "no frames" detector and to the smoothness windows
   *
   * @param quality - The element's `getVideoPlaybackQuality()`
   * @param valid - Whether the sample can be trusted: tab visible, playing, not seeking nor stalled
   */
  const sampleFrames = (el: HTMLVideoElement, quality: VideoPlaybackQuality, valid: boolean, now: number): void => {
    run.presented ||= quality.totalVideoFrames > run.framesAtLoad;

    const progress = stepFrameProgress(run.frameProgress, { mediaTime: el.currentTime, presented: run.presented, valid });

    run.frameProgress = progress.progress;

    if (progress.stalled) {
      fail('noFrames');

      return;
    }

    /**
     * Only a window played at normal speed tells whether the playback is smooth: faster, an engine counts the frames
     * the display cannot present as dropped (measured on a 60 fps file played directly: Chrome 157 counted 33 % of the
     * frames as dropped at 1.5x and 50 % at 2x, none at 1x; Firefox 159 none at any of them)
     */
    const smoothnessValid = valid && el.playbackRate === 1;

    run.window ??= { start: now, total: quality.totalVideoFrames, dropped: quality.droppedVideoFrames, valid: smoothnessValid };
    run.window.valid &&= smoothnessValid;

    if (now - run.window.start < DROPPED_FRAMES_WINDOW_MS) {
      return;
    }

    run.windows = [...run.windows, {
      totalFrames: quality.totalVideoFrames - run.window.total,
      droppedFrames: quality.droppedVideoFrames - run.window.dropped,
      valid: run.window.valid
    }].slice(-DROPPED_FRAMES_CONSECUTIVE_WINDOWS);
    run.window = { start: now, total: quality.totalVideoFrames, dropped: quality.droppedVideoFrames, valid: smoothnessValid };

    if (isNotSmooth(run.windows)) {
      run.windows = [];
      onNotSmooth();
    }
  };

  /**
   * Ends the current buffering stall, if any
   */
  const endStall = (at: number): void => {
    const startedAt = run.stallStartedAt;

    run.stallStartedAt = undefined;

    if (startedAt !== undefined) {
      playbackObservations.stalls.value++;
      onNetworkEvent({ type: 'stall', startedAt, at, ended: true });
    }
  };

  /**
   * Follows buffering stalls: the media time not advancing between two samples while the element should be playing
   * (not paused, seeking, ended nor loading a new source), or a `waiting` event. `waiting` alone is not enough: an
   * engine can stop at the end of the buffer without firing it (measured: Chrome with hls.js, playhead stopped 0.04 to
   * 0.07 s before the end of the buffer, `readyState` kept at 3 or more).
   */
  const trackStall = (el: HTMLMediaElement, now: number): void => {
    const previous = run.lastSample;

    run.lastSample = { at: now, mediaTime: el.currentTime };

    /**
     * A seek ends once the playback moves again, not at `playing`: after a seek to a buffered position, Chrome, Chromium
     * and Firefox fire `waiting` then `playing` (measured in a bare element and through hls.js), but WebKit playing a
     * file fires neither
     */
    if (run.afterSeek && run.seeked && previous && el.currentTime !== previous.mediaTime) {
      run.afterSeek = false;
    }

    const shouldAdvance = run.playing && !run.afterSeek && !el.paused && !el.seeking && !el.ended;

    if (!shouldAdvance || !previous) {
      return;
    }

    if (el.currentTime === previous.mediaTime) {
      run.stallStartedAt ??= previous.at;
      onNetworkEvent({ type: 'stall', startedAt: run.stallStartedAt, at: now, ended: false });
    } else if (run.stallStartedAt !== undefined && run.stallStartedAt <= previous.at) {
      /**
       * Only a stall that started before the previous sample: one a `waiting` event started after it can't be ended
       * by comparing with that sample, since the time may have moved before the stall
       */
      endStall(now);
    }
  };

  /**
   * Samples the element: frames, buffer and size for the statistics, and the inputs of every supervisor
   */
  const sample = (): void => {
    const el = mediaElementRef.value;

    if (!el || !playbackManager.currentPlaybackKey.value) {
      return;
    }

    const now = performance.now();
    // Feature detection: without the API there are no frame counters, and the frame supervisors do nothing
    const quality = el instanceof HTMLVideoElement && 'getVideoPlaybackQuality' in el ? el.getVideoPlaybackQuality() : undefined;
    const bufferAhead = getBufferedAhead(el.buffered, el.currentTime);

    playbackObservations.bufferAhead.value = bufferAhead;
    playbackObservations.frames.value = quality ? { total: quality.totalVideoFrames, dropped: quality.droppedVideoFrames } : undefined;
    playbackObservations.videoSize.value = el instanceof HTMLVideoElement ? { width: el.videoWidth, height: el.videoHeight } : undefined;

    if (expectsVideo(el) && quality && !run.acted) {
      const advancing = run.playing && !el.paused && !el.seeking && run.stallStartedAt === undefined;

      sampleFrames(el, quality, isDocumentVisible.value && advancing, now);
    }

    trackStall(el, now);

    const context = getAutoContext();

    onNetworkEvent({
      type: 'sample',
      at: now,
      paused: el.paused,
      estimate: run.measured ? sessionNetworkEstimate.value : undefined,
      bufferAhead,
      upBitrate: context ? getUpStep(context.state, context.video, context.askedAt, now)?.bitrate : undefined
    });
  };

  useIntervalFn(sample, SUPERVISOR_SAMPLE_MS);

  /**
   * The wait for the first frame the element presents for the current load
   */
  let pendingFrame: { el: HTMLVideoElement; handle: number } | undefined;

  /**
   * Waits for the first video frame the element presents for the load that just started, instead of the previous
   * load's. The frame counter does not tell it in every engine (measured: Firefox counts no frame until the second
   * one is presented, 10 s into a file with one frame every 10 s), the frame callback does. Feature detection:
   * without `requestVideoFrameCallback` only the counter tells.
   */
  const watchPresentedFrame = (el: EventTarget | null): void => {
    if (pendingFrame) {
      pendingFrame.el.cancelVideoFrameCallback(pendingFrame.handle);
      pendingFrame = undefined;
    }

    if (el instanceof HTMLVideoElement && 'requestVideoFrameCallback' in el) {
      pendingFrame = {
        el,
        handle: el.requestVideoFrameCallback(() => {
          pendingFrame = undefined;
          run.presented = true;
        })
      };
    }
  };

  useEventListener(mediaElementRef, 'loadstart', (event: Event) => {
    const el = event.target;
    const framesAtLoad = el instanceof HTMLVideoElement && 'getVideoPlaybackQuality' in el ? el.getVideoPlaybackQuality().totalVideoFrames : 0;

    Object.assign(run, {
      playing: false, afterSeek: false, seeked: false, hlsSeek: false, stallStartedAt: undefined, lastSample: undefined,
      presented: false, framesAtLoad, frameProgress: undefined, window: undefined, windows: []
    });
    watchPresentedFrame(el);

    if (!hls?.media || hls.media !== mediaElementRef.value) {
      playbackObservations.hlsStream.value = undefined;
    }
  });
  useEventListener(mediaElementRef, 'loadedmetadata', (event: Event) => {
    const el = event.target;

    if (el instanceof HTMLMediaElement && expectsVideo(el) && el.videoWidth === 0) {
      fail('noPicture');
    }
  });

  /**
   * The {@link LoadRun} of the source being supervised, started again when the source changes
   */
  const currentLoadRun = (): LoadRun => {
    if (loadRun.url !== run.url) {
      clearTimeout(loadRun.timer);
      loadRun = { url: run.url, worked: false, attempts: NO_NETWORK_ATTEMPTS, handling: false };
    }

    return loadRun;
  };

  /**
   * Whether the element presented a video frame in this load: the frame callback or the frame counter tell it (see
   * `watchPresentedFrame`). An engine with neither API can only tell that it decoded a picture.
   */
  const hasPresentedFrame = (el: HTMLVideoElement): boolean => {
    const quality = 'getVideoPlaybackQuality' in el ? el.getVideoPlaybackQuality() : undefined;

    return run.presented
      || (quality ? quality.totalVideoFrames > run.framesAtLoad : el.videoWidth > 0 && !('requestVideoFrameCallback' in el));
  };

  /**
   * Whether the element loads the source itself (a direct play, or HLS played natively), instead of hls.js feeding it
   */
  const loadsItself = (el: HTMLMediaElement): boolean => !hls?.media || hls.media !== el;

  /**
   * A load trouble of a source the element loads itself: `MediaError` 4 (`unsupported`), 2 (`network`), the element
   * telling that data stopped coming while it starves (`stalled`), or the media time standing still with no data arriving
   * (`still`, see `watchStillTime`). A resource that does not answer gives a 4 before the
   * metadata is known (the HTML specification sends it to the same steps as an unsupported format) and a 2 after it,
   * and a connection cut in the middle may give no error at all (measured: WebKit waited 150 s; Chrome fired `stalled`
   * after 1.2 s and MediaError 2 after 19 s), so whether the resource answers is checked first (see
   * {@link checkResource}):
   * - it answers: a 4 is a media error, which the failure ladder learns; a 2 was the connection, which is back; a stall
   * is a slow network, which the element waits for; but in a direct play, a time that stood still with no data arriving
   * means the connection the element holds went silent without closing (a network switch, a NAT or a proxy dropping it)
   * while new requests are served: it is loaded again, like a network error. Not for HLS played natively: its URL is a
   * playlist, and a still time is the playhead waiting for a segment a transcode slower than real time has not made yet
   * (a segment that hangs while the playlist answers stays undetected there)
   * - it does not: it's the network or the server, which says nothing about the browser. Nothing is learned
   * A network error is loaded again where it was, a bounded number of times like hls.js's network errors in the player
   * (`stepNetworkRecovery`: a 4 counts as a manifest that never loaded, the rest as a stream that stopped), then the
   * playback stops with an error. A 401 means the session is gone: it stops at once. Once started, a recovery always
   * ends without waiting for the element to raise anything else (see `watchRecovery`).
   */
  const onLoadTrouble = async (el: HTMLMediaElement, trouble: 'unsupported' | 'network' | 'stalled' | 'still'): Promise<void> => {
    const state = currentLoadRun();

    if (!state.url || run.acted || state.handling) {
      return;
    }

    state.handling = true;
    // A trouble during a new load of the recovery replaces its watch
    clearTimeout(state.timer);

    const position = el.currentTime;
    const answer = await checkResource(state.url);

    // The playback moved on meanwhile (another source or element, or the player closed)
    if (currentLoadRun() !== state || mediaElementRef.value !== el) {
      state.handling = false;

      return;
    }

    // A direct play holds one long download of the resource: what can fail while the resource answers is that download
    const ownDownloadFailed = trouble === 'still' && playbackManager.currentPlaybackMethod.value === 'DirectPlay';

    if (answer === 'answers' && trouble !== 'network' && !ownDownloadFailed) {
      state.handling = false;

      if (trouble === 'unsupported') {
        onMediaError();
      } else if (state.failedAt !== undefined) {
        // A recovery under way keeps watching its new load (its watch was replaced when this trouble started)
        watchRecovery(el, state);
      }

      return;
    }

    const failure = trouble === 'unsupported' ? 'manifest' : 'stream';
    const { recovery, attempts } = stepNetworkRecovery(state.attempts, failure);

    if (answer === 'unauthorized' || recovery.action === 'stop') {
      console.error(`the media could not be loaded from the server (${trouble}, ${answer}) after ${state.attempts[failure]} attempts`);
      useSnackbar(i18next.t('playbackNetworkFailed'), 'error');
      playbackManager.stop();

      return;
    }

    if (state.attempts.manifest + state.attempts.stream === 0) {
      useSnackbar(i18next.t('networkError'), 'error');
    }

    console.error(`the media stopped loading (${trouble}), trying again in ${recovery.delayMs} ms`);
    state.attempts = attempts;
    state.failedAt = position;
    state.timer = setTimeout(() => {
      state.handling = false;

      if (currentLoadRun() !== state || mediaElementRef.value !== el) {
        return;
      }

      state.reloading = true;
      el.load();
      // The new load starts where the playback was
      el.currentTime = position;
      watchRecovery(el, state);
    }, recovery.delayMs);
  };

  /**
   * Watches a new load of a recovery, so every recovery ends in bounded time, playing again or stopped with the error.
   * Playing on past the position that failed ends the recovery (see the `timeupdate` listener), and so does a load that
   * has what it needs to play while the user keeps the playback paused. Otherwise, a load whose buffer did not grow during
   * {@link MEDIA_RESOURCE_CHECK_TIMEOUT_MS} is another failure of the stream; one whose buffer grows is catching up, and
   * is watched again. Nothing else can be relied on: a new load can hang with no event at all (measured: Chrome kept a
   * reload of a direct play paused at `readyState` 1, no error, through a connection that stopped without closing), a
   * new load is paused until it can autoplay, which `stalled` ignores, and an engine can report data it does not play
   * (measured: Firefox kept `readyState` 4 with the time stuck).
   */
  const watchRecovery = (el: HTMLMediaElement, state: LoadRun): void => {
    const bufferedEnd = getBufferedEnd(el);

    state.timer = setTimeout(() => {
      if (currentLoadRun() !== state || mediaElementRef.value !== el || state.failedAt === undefined) {
        return;
      }

      if (playbackManager.isPaused.value && el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        state.attempts = NO_NETWORK_ATTEMPTS;
        state.failedAt = undefined;
        // Kept paused, it does not fire `playing`
        state.reloading = false;

        return;
      }

      if (getBufferedEnd(el) > bufferedEnd) {
        watchRecovery(el, state);

        return;
      }

      void onLoadTrouble(el, 'network');
    }, MEDIA_RESOURCE_CHECK_TIMEOUT_MS);
  };

  useEventListener(mediaElementRef, 'error', (event: Event) => {
    const el = event.target;
    const code = el instanceof HTMLMediaElement ? el.error?.code : undefined;

    if (el instanceof HTMLMediaElement && loadsItself(el)
      && (code === MediaError.MEDIA_ERR_NETWORK || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)) {
      void onLoadTrouble(el, code === MediaError.MEDIA_ERR_NETWORK ? 'network' : 'unsupported');
    } else if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      onMediaError();
    }
  });

  /**
   * Whether the element starves: too little data to go on, as it reports it or as its buffer shows it (see
   * `watchStillTime`)
   */
  const isStarving = (el: HTMLMediaElement): boolean => el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
    || getBufferedAhead(el.buffered, el.currentTime) < STARVED_BUFFER_AHEAD_S;

  /**
   * Whether the media time stood still while playing, with no data arriving, for {@link NETWORK_LONG_STALL_MS}: then the
   * playback is stuck whatever the element says (measured: Firefox, through a connection that stopped without closing,
   * kept `readyState` 4 with the time stuck, fired `stalled` only before the buffer ran out, and raised no error). The
   * resource is checked (`still`, see `onLoadTrouble`): if it does not answer, the network or the server failed; if it
   * answers, the connection the element holds is what failed. Either way the source is loaded again where it was, within
   * the bounded recovery. Only while the element starves: it reports too little data to go on (`readyState` below
   * `HAVE_FUTURE_DATA`, what Chrome and WebKit report when stuck), or it has less than {@link STARVED_BUFFER_AHEAD_S}
   * buffered ahead (Firefox keeps `readyState` 4 with the time stuck); a time stuck with plenty of data ahead (a full
   * read-ahead) is not the network's doing. Not while paused, seeking or ended; not while the buffer grows (a slow network
   * the element waits for: zero bytes in that time is longer than the HTML specification's own wait before `stalled`,
   * about three seconds); not while a trouble is handled or a recovery is under way, which watch themselves.
   */
  const watchStillTime = (): void => {
    const el = mediaElementRef.value;
    const state = currentLoadRun();

    if (!el || !state.url || !loadsItself(el) || el.paused || el.seeking || el.ended || run.acted
      || state.handling || state.failedAt !== undefined
      || !isStarving(el)) {
      state.still = undefined;

      return;
    }

    const now = performance.now();
    const mediaTime = el.currentTime;
    const bufferedEnd = getBufferedEnd(el);
    const { still } = state;

    if (still?.mediaTime !== mediaTime || bufferedEnd > still.bufferedEnd) {
      state.still = { mediaTime, bufferedEnd, since: now };
    } else if (now - still.since >= NETWORK_LONG_STALL_MS) {
      state.still = undefined;
      void onLoadTrouble(el, 'still');
    }
  };

  useIntervalFn(watchStillTime, SUPERVISOR_SAMPLE_MS);
  useEventListener(mediaElementRef, 'stalled', (event: Event) => {
    const el = event.target;

    if (el instanceof HTMLMediaElement && loadsItself(el) && !el.paused && el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      void onLoadTrouble(el, 'stalled');
    }
  });
  /**
   * A seek of the user starts a new stretch of playback: the recovery of the previous one is over, and a trouble of the
   * new stretch gets the whole allowance (the allowance is there so that one stretch never retries without end; seeking
   * takes the user). Not while a trouble is handled, and not the recovery's own seeks.
   */
  useEventListener(mediaElementRef, 'seeking', () => {
    const state = currentLoadRun();

    if (state.failedAt !== undefined && !state.handling && !state.reloading) {
      state.attempts = NO_NETWORK_ATTEMPTS;
      state.failedAt = undefined;
    }
  });
  useEventListener(mediaElementRef, 'playing', () => {
    currentLoadRun().reloading = false;
  });
  useEventListener(mediaElementRef, ['loadstart', 'seeking'], () => {
    currentLoadRun().advanceFrom = undefined;
  });
  /**
   * Tells the playback manager once the playback works with the streams it was negotiated with: the time advanced
   * while playing (not by a seek) and, for video, a frame was presented; again when a renegotiation changes the streams
   * and keeps the URL. Also ends the element's network recovery once the playback played on past the position that
   * failed for {@link NETWORK_LONG_STALL_MS}, as long as it takes to notice a stall: a new load that plays a moment and
   * gets stuck again is the same failure (measured: Chrome, with every connection of the element going silent after
   * 50 kB, was loaded again 22 times in 150 s, 0.4 s further each time, when any progress ended the recovery).
   */
  useEventListener(mediaElementRef, 'timeupdate', (event: Event) => {
    const el = event.target;
    const state = currentLoadRun();

    if (!(el instanceof HTMLMediaElement) || !state.url || el.seeking) {
      return;
    }

    if (state.failedAt !== undefined && el.currentTime >= state.failedAt + NETWORK_LONG_STALL_MS / 1000) {
      state.attempts = NO_NETWORK_ATTEMPTS;
      state.failedAt = undefined;
    }

    const signature = playbackManager.currentVerdict.value?.signature;

    if ((state.worked && state.workedAs === signature) || el.paused) {
      return;
    }

    if (state.advanceFrom === undefined || state.advanceAs !== signature || el.currentTime < state.advanceFrom) {
      state.advanceFrom = el.currentTime;
      state.advanceAs = signature;
    } else if (el.currentTime > state.advanceFrom && (!expectsVideo(el) || hasPresentedFrame(el))) {
      state.worked = true;
      state.workedAs = signature;
      playbackManager.reportPlaybackWorked(state.url);
    }
  });
  useEventListener(mediaElementRef, 'seeking', () => {
    if (run.hlsSeek) {
      run.hlsSeek = false;

      return;
    }

    run.afterSeek = true;
    run.seeked = false;
    run.stallStartedAt = undefined;
  });
  useEventListener(mediaElementRef, 'seeked', () => {
    run.seeked = true;
  });
  useEventListener(mediaElementRef, 'waiting', (event: Event) => {
    const el = event.target;

    if (run.playing && !run.afterSeek && el instanceof HTMLMediaElement && !el.paused) {
      run.stallStartedAt ??= performance.now();
    }
  });
  useEventListener(mediaElementRef, 'playing', () => {
    run.playing = true;
    run.afterSeek = false;
    endStall(performance.now());
  });

  /**
   * hls.js reset the media source by itself: its error controller calls `recoverMediaError` for every
   * `MEDIA_SOURCE_REQUIRES_RESET`, fatal or not, before the app hears of the error (hls.js 1.7.3), and its own count of
   * them starts again whenever a fragment buffers, so a segment that cannot be appended reloads the source again and
   * again. Each reset counts toward {@link HLS_MEDIA_ERROR_RECOVERIES} like a recovery the app asks for, and past it it's
   * a hard failure. A fatal one also stopped loading: within the bound, loading resumes where the playback was.
   */
  const onHlsReset = (fatal: boolean): void => {
    if (run.recoveries < HLS_MEDIA_ERROR_RECOVERIES) {
      run.recoveries++;
      useSnackbar(i18next.t('mediaError'), 'error');

      if (fatal) {
        hls?.startLoad();
      }
    } else {
      fail('hlsMediaError');
    }
  };

  /**
   * hls.js moves the playhead itself to get over a stall or a hole, and announces it right after setting the time
   * (hls.js 1.7, gap controller): the seek that follows is not the user's
   */
  hls?.on(Events.ERROR, (_event, data) => {
    if (data.details === ErrorDetails.BUFFER_NUDGE_ON_STALL || data.details === ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
      run.hlsSeek = true;
    } else if (data.details === ErrorDetails.MEDIA_SOURCE_REQUIRES_RESET) {
      onHlsReset(data.fatal);
    }
  });
  hls?.on(Events.FRAG_BUFFERED, (_event, data: FragBufferedData) => {
    const estimate = hls.bandwidthEstimate;

    if (data.frag.type === PlaylistLevelType.MAIN && Number.isFinite(estimate) && estimate > 0) {
      run.measured = true;
      sessionNetworkEstimate.value = estimate;
    }
  });
  hls?.on(Events.BUFFER_CODECS, (_event, data: BufferCodecsData) => {
    /**
     * A muxed stream (audio and video in one fMP4, which is what the server sends) has a single track whose codec
     * hls.js builds as "<audio>,<video>" (passthrough remuxer of hls.js 1.7)
     */
    const [muxedAudio, muxedVideo] = data.audiovideo?.codec?.split(',') ?? [];

    playbackObservations.hlsStream.value = {
      container: (data.audiovideo ?? data.video ?? data.audio)?.container,
      video: data.video?.codec ?? muxedVideo,
      audio: data.audio?.codec ?? muxedAudio
    };
  });

  return {
    /**
     * Starts supervising a new source (or none)
     */
    startSource: (url?: string): void => {
      if (url === run.url) {
        return;
      }

      if (run.pendingStep) {
        playbackObservations.lastChange.value = run.pendingStep.change;
      }

      run = newRun(url);
    },
    onHlsMediaError: onMediaError
  };
}
