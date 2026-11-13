/**
 * The runtime supervisors of the local playback. They only sample the media element and hls.js and act on what the
 * pure functions of the playback capability engine decide:
 * - failure ladder: the media element's error, a media error hls.js cannot recover from, no picture once the metadata
 * loaded, or no frame ever presented while the time advances, move one rung down (`playbackManager.reportPlaybackFailure`)
 * - smoothness: too many dropped frames move Automatic down; other modes get one warning per playback
 * - network (Automatic only): buffering stalls move it down, a margin of the network estimate sustained while playing
 * moves it up
 */
import type Hls from 'hls.js';
import { ErrorDetails, Events, PlaylistLevelType, type BufferCodecsData, type FragBufferedData } from 'hls.js';
import { useEventListener, useIntervalFn } from '@vueuse/core';
import i18next from 'i18next';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { isDocumentVisible, mediaElementRef } from '#/store/index.ts';
import { getPlaybackPolicy } from '#/store/playback-capabilities.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import {
  getCurrentAutoState,
  playbackObservations,
  sessionNetworkEstimate,
  setAutoState,
  type PlaybackChangeReason,
  type RunningQuality
} from '#/store/playback-quality.ts';
import {
  DROPPED_FRAMES_CONSECUTIVE_WINDOWS,
  DROPPED_FRAMES_WINDOW_MS,
  HLS_MEDIA_ERROR_RECOVERIES,
  SUPERVISOR_SAMPLE_MS
} from '#/utils/playback-capabilities/constants.ts';
import {
  getDownStep,
  getSmoothnessStep,
  getUpStep,
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
  startNetworkMemory,
  stepFrameProgress,
  stepNetwork,
  type FrameProgress,
  type FrameWindow,
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
   * Whether a supervisor already acted on this source: the next source starts again
   */
  acted: boolean;
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
 * Playbacks (by key) that were already warned about not being smooth
 */
const warnedNotSmooth = new Set<string>();

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
 * @param hls - The player's hls.js instance, if the engine supports it
 * @returns `startSource`, to call whenever the player loads a new URL (or none), and `onHlsMediaError`, to call for
 * a fatal media error of hls.js that is not a codec error
 */
export function usePlaybackSupervisors(hls: Hls | undefined) {
  let run = newRun();

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
   * Moves Automatic to another state, once per source
   */
  const moveAuto = (context: NonNullable<ReturnType<typeof getAutoContext>>, state: AutoState, reason: PlaybackChangeReason): void => {
    run.acted = true;
    playbackObservations.lastChange.value = {
      kind: 'quality',
      reason,
      from: playbackManager.currentRunningQuality.value ?? 'original',
      to: getTargetEntry(state, context.video),
      at: Date.now()
    };
    setAutoState(context.key, state);
  };

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
  useEventListener(mediaElementRef, 'error', (event: Event) => {
    const code = event.target instanceof HTMLMediaElement ? event.target.error?.code : undefined;

    if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      onMediaError();
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
      if (url !== run.url) {
        run = newRun(url);
      }
    },
    onHlsMediaError: onMediaError
  };
}
