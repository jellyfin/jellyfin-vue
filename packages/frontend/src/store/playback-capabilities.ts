/**
 * Runtime state of the playback capability engine shared by the whole app: the capability oracle, what was
 * learned during this session, and the verdict for a media source with everything the client knows about itself.
 * Nothing here is persisted except the probe results, which live in the api database next to their items.
 *
 * What a failure teaches (see `verdict.ts` for the rules): the failed rung, as the learned floor of the verdict's
 * signature, which also ends the single attempt a verdict makes with streams nobody could check (from then on they are
 * encoded); and, for a stream copied into the server's HLS output, that its media source answers are wrong
 * ({@link recordMediaSourceFailure}), which counts as evidence even where the browser could not answer exactly. All of
 * it belongs to the user and the server it was learned with: it is forgotten when either changes.
 */
import type { BaseItemDto, MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowReactive, shallowRef, watch } from 'vue';
import { withTimeout } from '@jellyfin-vue/shared/promises';
import { PROBE_PLAYBACK_WAIT_MS } from '#/utils/playback-capabilities/constants.ts';
import {
  createBrowserOracle,
  DISPROVED,
  getConfigurationKey,
  type CapabilityOracle
} from '#/utils/playback-capabilities/oracle.ts';
import { isCurrentProbe, isRememberedForSession, probeMediaSource, type ProbeResult } from '#/utils/playback-capabilities/probe.ts';
import {
  computeVerdict,
  getMediaSourceQuestions,
  getNextFloor,
  type LearnedFloor,
  type PlaybackMethod,
  type PlaybackOutcome,
  type PlaybackPolicy,
  type Verdict,
  type VerdictEnvironment
} from '#/utils/playback-capabilities/verdict.ts';
import { remote } from '#/plugins/remote/index.ts';
import { apiStore } from '#/store/dbs/api/index.ts';
import { hasHDRDisplay } from '#/store/index.ts';
import { playbackSettings } from '#/store/settings/playback.ts';
import { getStaticStreamUrl } from '#/utils/items.ts';
import { getVideoStream, type QualityMode } from '#/utils/playback-capabilities/quality.ts';
import { SUBTITLE_RENDERERS } from '#/utils/subtitle-renderers.ts';

/**
 * The tracks a verdict is computed for, as absolute `MediaStream.Index` values. Undefined means the media
 * source's default; for subtitles, -1 means none.
 */
export interface StreamSelection {
  readonly videoStreamIndex?: number;
  readonly audioStreamIndex?: number;
  readonly subtitleStreamIndex?: number;
}

/**
 * Options of {@link getMediaSourceVerdict}
 */
export interface MediaSourceVerdictOptions {
  /**
   * The longest wait for the file to be probed. Without the probe in time the verdict is computed from the
   * server's data (generic candidates, so the streams the browser does not confirm are assumed to play, once); the
   * probe goes on and its result is stored for the next verdict.
   */
  readonly probeWaitMs?: number;
  /**
   * The quality mode to compute the verdict for, instead of the one the preferred quality means for the media
   * source. The playback manager passes the level Automatic is running at during a playback.
   */
  readonly quality?: QualityMode;
}

const browserOracle = createBrowserOracle();

/**
 * Questions playback proved wrong this session (see {@link recordMediaSourceFailure}), by configuration key: answered
 * "supported" by the browser, or assumed to play because the browser could not answer them exactly
 */
const disprovenAnswers = shallowReactive(new Set<string>());

/**
 * The app's only capability oracle, so every verdict shares its memoised answers: the browser's, asked on the display
 * the window is on (an answer does not outlive a change of the dynamic range media query), except for the questions
 * playback disproved this session, which are answered {@link DISPROVED}
 */
export const capabilityOracle: CapabilityOracle = {
  query: async (config, context) =>
    disprovenAnswers.has(getConfigurationKey(config))
      ? DISPROVED
      : browserOracle.query(config, { ...context, hdrDisplay: hasHDRDisplay.value }),
  clear: () => {
    browserOracle.clear();
    disprovenAnswers.clear();
  }
};

/**
 * The learned floor of each stream signature (see {@link LearnedFloor}). Memory only: it is lost on reload.
 * Reactive, so what depends on a floor is updated when a playback teaches a new one.
 */
const learnedFloors = shallowReactive(new Map<string, PlaybackMethod>());

/**
 * Whether the media element was seen exposing an audio track list that does not match the file's audio streams
 * this session, so it cannot be trusted to switch audio tracks
 */
const audioTrackSwitchingFailed = shallowRef(false);

/**
 * Whether the media element can switch the audio track of a file it plays directly: it exposes `audioTracks`
 * (feature detection) and that list was never seen not matching a file's audio streams
 */
export const canSelectAudioTrack = computed(() =>
  'audioTracks' in HTMLMediaElement.prototype && !audioTrackSwitchingFailed.value
);

/**
 * The learned floors of this session, as the verdict's environment expects them
 */
export const getLearnedFloor: LearnedFloor = signature => learnedFloors.get(signature);

/**
 * Records what a playback taught about a verdict's streams, so later verdicts for the same signature never start
 * below it. Floors only rise.
 *
 * @param verdict - The verdict the playback was negotiated with
 * @param outcome - What happened: the playback failed at a rung, or the server chose another method
 */
export function recordPlaybackOutcome(verdict: Pick<Verdict, 'method' | 'signature'>, outcome: PlaybackOutcome): void {
  const floor = getNextFloor(verdict, outcome, learnedFloors.get(verdict.signature));

  if (floor !== undefined) {
    learnedFloors.set(verdict.signature, floor);
  }
}

/**
 * Records that the media element exposed an audio track list that does not match the audio streams of the file
 * it plays, so it cannot switch to the selected one: from now on, a secondary audio track is remuxed
 */
export function recordAudioTrackSwitchingFailure(): void {
  audioTrackSwitchingFailed.value = true;
}

/**
 * Records that the media source playback of a negotiated stream failed with a codec error (the player could not
 * even create the buffer for it), although the browser said it plays. With one stream copied into the server's
 * output, that stream's media source answers are disproved for the session, so its next verdict encodes it; with
 * both copied (a remux), which one failed is unknown, so it counts as a failure of the remux, whose next rung
 * encodes the audio. Encoded streams are not suspects: their targets were checked before being asked for.
 *
 * When nothing new can be disproved (a stream nobody knows was never asked about, or its answers were disproved
 * already), it counts as a failure of the verdict's method too: otherwise nothing would change and the playback
 * would stay broken.
 *
 * @param item - The item the media source belongs to
 * @param source - The media source the verdict was computed for
 * @param verdict - The verdict the playback was negotiated with
 * @returns Whether an answer was disproved, which negotiates the playback again by itself (see
 * {@link renegotiatingEnvironment})
 */
export async function recordMediaSourceFailure(
  item: BaseItemDto,
  source: MediaSourceInfo,
  verdict: Pick<Verdict, 'method' | 'signature' | 'video' | 'audio'>
): Promise<boolean> {
  const copied = [verdict.video, verdict.audio].filter(plan => plan?.action === 'copy');
  const index = copied.length === 1 ? copied[0]?.index : undefined;

  if (index !== undefined) {
    // The questions the next verdict will ask: with the probe it will find stored
    const probe = item.Id && source.Id ? await getStoredProbe(item.Id, source) : undefined;
    const known = disprovenAnswers.size;

    for (const config of getMediaSourceQuestions(source, index, probe)) {
      disprovenAnswers.add(getConfigurationKey(config));
    }

    if (disprovenAnswers.size > known) {
      return true;
    }
  }

  if (verdict.method !== 'Unplayable' && verdict.method !== 'DirectPlay') {
    recordPlaybackOutcome(verdict, { failedAt: verdict.method });
  }

  return false;
}

/**
 * Forgets what this session learned about what this client plays: the oracle's answers (also those playback
 * disproved), the learned floors and what was seen of the media element. The stored probe results stay: they are
 * about files.
 */
function forgetSessionMemory(): void {
  capabilityOracle.clear();
  learnedFloors.clear();
  audioTrackSwitchingFailed.value = false;
}

/**
 * Forgets everything learned about what this client plays: the session's memory (see {@link forgetSessionMemory}) and
 * the stored probe results. The memory is cleared even if clearing the stored probes fails, in which case it rejects.
 */
export async function forgetLearnedCompatibility(): Promise<void> {
  forgetSessionMemory();
  await forgetStoredProbes();
}

/**
 * What a session learned was learned with one user on one server: the media sources it names are that server's, and
 * the methods it learned were limited by that user's policy. A change of either (logout, another user, another server)
 * forgets it; the stored probes stay, since they are about files.
 */
watch([() => remote.auth.currentServer.value?.Id, () => remote.auth.currentUserId.value], forgetSessionMemory);

/**
 * == VERDICTS ==
 */

/**
 * Probes in flight, by media source and file version, so concurrent verdicts for one file share one probe
 */
const pendingProbes = new Map<string, Promise<ProbeResult | undefined>>();

/**
 * Counts the times the stored probe results were forgotten: a probe that started before the last time does not store
 * its result (see {@link readProbe})
 */
const probeGeneration = { current: 0 };

/**
 * Probe results being written to the database, which forgetting waits for
 */
const pendingProbeStores = new Set<Promise<boolean>>();

/**
 * Results that are not stored but not probed again this session either (see `isRememberedForSession`), by the key of
 * {@link pendingProbes}. Memory only: a reload probes them again.
 */
const sessionProbes = new Map<string, ProbeResult>();

/**
 * Forgets the stored probe results, also those of the probes still running or being stored, so the files are probed
 * again: the probes in flight are left to their verdicts, but no later verdict waits for them and none stores its result
 */
async function forgetStoredProbes(): Promise<void> {
  probeGeneration.current++;
  pendingProbes.clear();
  sessionProbes.clear();
  await Promise.allSettled(pendingProbeStores);
  await apiStore.mediaProbesClear();
}

/**
 * The user policy flags the verdict depends on
 */
export function getPlaybackPolicy(): PlaybackPolicy {
  const policy = remote.auth.currentUser.value?.Policy;

  return {
    EnableVideoPlaybackTranscoding: policy?.EnableVideoPlaybackTranscoding,
    EnableAudioPlaybackTranscoding: policy?.EnableAudioPlaybackTranscoding,
    EnablePlaybackRemuxing: policy?.EnablePlaybackRemuxing
  };
}

/**
 * What the verdict depends on that may change during a playback and has to re-negotiate it: the playback
 * settings, the user's policy and what was learned about the media element and the browser's answers. Learned floors are not here: they
 * belong to one verdict's signature (see {@link getLearnedFloor}). The HDR display is not here either: moving the
 * window to another display must not interrupt a playback.
 */
export const renegotiatingEnvironment = [
  () => playbackSettings.quality.value,
  () => playbackSettings.hdrMode.value,
  () => getPlaybackPolicy().EnableVideoPlaybackTranscoding,
  () => getPlaybackPolicy().EnableAudioPlaybackTranscoding,
  () => getPlaybackPolicy().EnablePlaybackRemuxing,
  () => canSelectAudioTrack.value,
  () => disprovenAnswers.size
] as const;

/**
 * Everything about this client a verdict depends on that may change, for what shows or decides with verdicts outside
 * a playback (like the ranking of an item's versions): the {@link renegotiatingEnvironment}, the HDR display and the
 * learned floors
 */
export const verdictEnvironmentSources = [
  ...renegotiatingEnvironment,
  () => hasHDRDisplay.value,
  () => JSON.stringify([...learnedFloors])
] as const;

/**
 * Everything about this client a verdict for a media source depends on, as it is now
 *
 * @param video - The selected video stream of the media source (undefined for music)
 */
export function getVerdictEnvironment(video?: MediaStream): VerdictEnvironment {
  return {
    hdrDisplay: hasHDRDisplay.value,
    hdrMode: playbackSettings.hdrMode.value,
    canSelectAudioTrack: canSelectAudioTrack.value,
    quality: playbackSettings.getQualityMode(video),
    policy: getPlaybackPolicy(),
    getLearnedFloor,
    subtitleRenderers: SUBTITLE_RENDERERS
  };
}

/**
 * Whether the media source is a file the server can serve byte ranges of. Remote sources, `.strm` files and live
 * streams have no file to read.
 */
function hasFile(source: MediaSourceInfo): boolean {
  return source.Protocol === 'File' && !source.IsRemote && !source.IsInfiniteStream && !source.RequiresOpening;
}

/**
 * The stored probe result of a media source for its current version, if any, and if this version of the probe and
 * of mediabunny read it (see `isCurrentProbe`): any other is probed again, and the new result replaces it
 */
async function getStoredProbe(itemId: string, source: MediaSourceInfo): Promise<ProbeResult | undefined> {
  try {
    const stored = source.Id ? await apiStore.getMediaProbe(itemId, source.Id, source.ETag) : undefined;

    return stored && isCurrentProbe(stored) ? stored : undefined;
  } catch {
    // Without the stored result, the file is probed again
  }
}

/**
 * Reads the probe result of a file: the stored one for its current version, or a new probe of its static stream,
 * which is stored if it depends only on the file, or else remembered for the session if it is not worth probing again
 * (see {@link sessionProbes}), unless something was forgotten since the probe started (see {@link forgetStoredProbes})
 *
 * @param key - The key of the file in {@link pendingProbes}
 */
async function readProbe(
  itemId: string,
  mediaType: 'Video' | 'Audio',
  source: MediaSourceInfo & { Id: string },
  key: string
): Promise<ProbeResult | undefined> {
  const generation = probeGeneration.current;
  const stored = await getStoredProbe(itemId, source);

  if (stored) {
    return stored;
  }

  const url = getStaticStreamUrl(source, mediaType);

  if (!url) {
    return;
  }

  const result = await probeMediaSource(url, { size: source.Size && source.Size > 0 ? source.Size : undefined });

  if (generation !== probeGeneration.current) {
    return result;
  }

  if (isRememberedForSession(result)) {
    sessionProbes.set(key, result);
  }

  const storing = apiStore.mediaProbeAdd(itemId, source.Id, source.ETag, result);

  pendingProbeStores.add(storing);

  try {
    await storing;
  } catch {
    // Not storing it only means the next verdict probes again
  } finally {
    pendingProbeStores.delete(storing);
  }

  return result;
}

/**
 * The probe result of a media source of an item, waiting at most `waitMs` for it. Undefined when the source has
 * no file to probe, or when the probe did not finish in time (it goes on, and is stored for later verdicts).
 */
async function getProbe(item: BaseItemDto, source: MediaSourceInfo, waitMs: number): Promise<ProbeResult | undefined> {
  const { Id: itemId, MediaType: mediaType } = item;
  const { Id: sourceId } = source;

  if (!itemId || !sourceId || (mediaType !== 'Video' && mediaType !== 'Audio') || !hasFile(source)) {
    return;
  }

  const key = `${sourceId}|${source.ETag ?? ''}`;
  const remembered = sessionProbes.get(key);

  if (remembered) {
    return remembered;
  }

  let pending = pendingProbes.get(key);

  if (!pending) {
    const probe = async () => {
      try {
        return await readProbe(itemId, mediaType, { ...source, Id: sourceId }, key);
      } finally {
        // Unless forgetting dropped it meanwhile (another probe of the file may be the pending one now)
        if (pendingProbes.get(key) === pending) {
          pendingProbes.delete(key);
        }
      }
    };

    pending = probe();
    pendingProbes.set(key, pending);
  }

  return withTimeout(pending, waitMs, undefined);
}

/**
 * The verdict for one media source of an item with the selected tracks: how this client would play it now, and
 * why. Probes the file when needed (the stored probe first), never waiting more than the probe wait for it.
 *
 * It can be computed for every version of an item, to rank them.
 *
 * @param item - The item the media source belongs to
 * @param source - The media source, as the item's `MediaSources` list it
 * @param selection - The selected tracks
 * @param options - See {@link MediaSourceVerdictOptions}
 */
export async function getMediaSourceVerdict(
  item: BaseItemDto,
  source: MediaSourceInfo,
  selection: StreamSelection = {},
  options: MediaSourceVerdictOptions = {}
): Promise<Verdict> {
  const probe = await getProbe(item, source, options.probeWaitMs ?? PROBE_PLAYBACK_WAIT_MS);
  const video = getVideoStream(source, selection.videoStreamIndex);

  const environment = getVerdictEnvironment(video);

  return computeVerdict({
    source,
    ...selection,
    probe,
    oracle: capabilityOracle,
    environment: options.quality ? { ...environment, quality: options.quality } : environment,
    mediaType: item.MediaType === 'Audio' || item.MediaType === 'Video' ? item.MediaType : undefined
  });
}
