/**
 * Runtime state of the quality of the local playback, shared by the playback manager, the runtime supervisors, the
 * quality menu and the playback statistics: the level Automatic runs at during the current playback, the network
 * estimate remembered for the session, what the supervisors observe and the last change of method or quality.
 * Memory only: nothing here survives a reload.
 */
import { shallowRef, watch } from 'vue';
import { playbackSettings } from '#/store/settings/playback.ts';
import {
  AUTO_START,
  getAutoMode,
  getAutoStartState,
  type AutoState
} from '#/utils/playback-capabilities/quality-auto.ts';
import type { QualityMode, VideoInfo } from '#/utils/playback-capabilities/quality.ts';
import type { PlaybackMethod } from '#/utils/playback-capabilities/verdict.ts';

/**
 * == AUTOMATIC ==
 */

/**
 * The state of Automatic for one playback, identified by the key the playback manager gives it
 */
interface AutoPlayback {
  readonly key: string;
  readonly state: AutoState;
}

const autoPlayback = shallowRef<AutoPlayback>();

/**
 * The network estimate of this session in bits per second: the last one hls.js measured while loading a stream.
 * Undefined until a stream was loaded through hls.js.
 */
export const sessionNetworkEstimate = shallowRef<number>();

/**
 * Incremented whenever a runtime supervisor changes the state of Automatic for the current playback, so the
 * playback manager negotiates it again. Creating the state of a new playback does not change it.
 */
export const autoQualityRevision = shallowRef(0);

/**
 * The state of Automatic for a playback: the one the supervisors moved it to, or, for a new playback, the one the
 * network estimate of the session gives
 *
 * @param key - Identifies the playback (item, version and play)
 * @param video - The video stream being played (undefined for music)
 */
export function getAutoState(key: string, video?: VideoInfo): AutoState {
  if (autoPlayback.value?.key !== key) {
    autoPlayback.value = { key, state: getAutoStartState(video, sessionNetworkEstimate.value) };
  }

  return autoPlayback.value.state;
}

/**
 * The state of Automatic for the current playback, if one was created (read only, for the supervisors and the UI)
 */
export function getCurrentAutoState(key: string): AutoState {
  return autoPlayback.value?.key === key ? autoPlayback.value.state : AUTO_START;
}

/**
 * The playback the counters of {@link playbackObservations} are about
 */
const observedPlayback = shallowRef<string>();

/**
 * The quality mode a playback is negotiated with: the preferred quality and, in Automatic, the level it runs at.
 * The first negotiation of a new playback also starts its observations again: the stall count and the last change
 * belong to one playback, not to the next item.
 *
 * @param key - Identifies the playback (item, version and play)
 * @param video - The video stream being played (undefined for music)
 */
export function getPlaybackQualityMode(key: string, video?: VideoInfo): QualityMode {
  if (observedPlayback.value !== key) {
    observedPlayback.value = key;
    playbackObservations.stalls.value = 0;
    playbackObservations.lastChange.value = undefined;
  }

  const preferred = playbackSettings.getQualityMode(video);

  return preferred.type === 'auto' ? getAutoMode(getAutoState(key, video)) : preferred;
}

/**
 * Moves Automatic to another state for the current playback, which negotiates it again. Ignored when the playback
 * changed since the supervisor sampled it.
 *
 * @param key - Identifies the playback the change was decided for
 * @param state - The new state
 */
export function setAutoState(key: string, state: AutoState): void {
  if (autoPlayback.value?.key !== key) {
    return;
  }

  autoPlayback.value = { key, state };
  autoQualityRevision.value++;
}

/**
 * Puts Automatic back to the state a playback runs at, without negotiating it again: the playback manager kept the
 * playback because the state a supervisor moved it to gave nothing playable. Ignored when the playback changed.
 *
 * @param key - Identifies the playback
 * @param state - The state the playback runs at
 */
export function restoreAutoState(key: string, state: AutoState): void {
  if (autoPlayback.value?.key === key) {
    autoPlayback.value = { key, state };
  }
}

/**
 * Choosing Automatic again starts it again from the network estimate, like a new playback. Synchronous, so the
 * negotiation that the change of preference causes already sees it.
 */
watch(() => playbackSettings.quality.value, (quality) => {
  if (quality === 'auto') {
    autoPlayback.value = undefined;
  }
}, { flush: 'sync' });

/**
 * == WHAT THE SUPERVISORS OBSERVE ==
 */

/**
 * Why the method or the quality changed:
 * - hard failures that move down the ladder: `mediaError` (the media element's error), `hlsMediaError` (hls.js could
 * not recover a media error), `hlsCodecError` (hls.js could not create a buffer for the stream), `noPicture` (no video
 * size once the metadata loaded), `noFrames` (no video frame presented since the load while the time advances),
 * `manual` (the user's "try another method")
 * - quality changes of Automatic: `notSmooth`, `networkDown`, `networkUp`
 */
export type PlaybackChangeReason
  = | 'mediaError' | 'hlsMediaError' | 'hlsCodecError' | 'noPicture' | 'noFrames' | 'manual'
    | 'notSmooth' | 'networkDown' | 'networkUp';

/**
 * A change of method (after a failure) or of quality (a decision of Automatic)
 */
export type PlaybackChange
  = | { readonly kind: 'method'; readonly reason: PlaybackChangeReason; readonly from: PlaybackMethod; readonly to: PlaybackMethod; readonly at: number }
    | { readonly kind: 'quality'; readonly reason: PlaybackChangeReason; readonly from: string; readonly to: string; readonly at: number };

/**
 * Container and codecs of what the media element is fed: the file's (direct play) or the stream hls.js buffers
 */
export interface PlayingStreamInfo {
  readonly container?: string;
  readonly video?: string;
  readonly audio?: string;
}

/**
 * What the runtime supervisors observe of the local playback, for the playback statistics
 */
export const playbackObservations = {
  /**
   * The frame counters of the media element (`getVideoPlaybackQuality()`); undefined without the API or video
   */
  frames: shallowRef<{ readonly total: number; readonly dropped: number }>(),
  /**
   * Seconds buffered ahead of the playback position
   */
  bufferAhead: shallowRef<number>(),
  /**
   * Buffering stalls seen during the current playback (outside seeks and loads of a new source)
   */
  stalls: shallowRef(0),
  /**
   * The size of the video the element decodes
   */
  videoSize: shallowRef<{ readonly width: number; readonly height: number }>(),
  /**
   * What hls.js buffers, read from its buffer codecs; undefined when playing directly
   */
  hlsStream: shallowRef<PlayingStreamInfo>(),
  /**
   * The last change of method or quality of the current playback
   */
  lastChange: shallowRef<PlaybackChange>()
};
