/**
 * What the samples the runtime supervisors take from the media element mean: whether the playback is smooth, whether
 * the video produces frames, and whether the network keeps up. Pure decisions over plain values: the supervisors
 * sample, these functions judge.
 */
import {
  DROPPED_FRAMES_CONSECUTIVE_WINDOWS,
  DROPPED_FRAMES_RATIO,
  FRAMES_STALL_MEDIA_SECONDS,
  NETWORK_LONG_STALL_MS,
  NETWORK_STALL_COUNT,
  NETWORK_STALL_MIN_MS,
  NETWORK_STALL_WINDOW_MS,
  NETWORK_UP_FACTOR,
  NETWORK_UP_HOLD_MS,
  NETWORK_UP_MIN_BUFFER_S,
  NETWORK_UP_SUSTAIN_MS
} from './constants.ts';

/**
 * == SMOOTHNESS ==
 */

/**
 * The frames presented or dropped during one window (`getVideoPlaybackQuality()` deltas)
 */
export interface FrameWindow {
  readonly totalFrames: number;
  readonly droppedFrames: number;
  /**
   * Whether the whole window was observed playing the same source at normal speed with the tab visible (no pause,
   * seek, hidden tab or other playback rate)
   */
  readonly valid: boolean;
}

/**
 * Whether the playback is not smooth: the latest {@link DROPPED_FRAMES_CONSECUTIVE_WINDOWS} windows were all observed
 * while visible and playing at normal speed, and each dropped more than {@link DROPPED_FRAMES_RATIO} of its frames
 *
 * @param windows - The windows observed so far, oldest first
 */
export function isNotSmooth(windows: readonly FrameWindow[]): boolean {
  const latest = windows.slice(-DROPPED_FRAMES_CONSECUTIVE_WINDOWS);

  return latest.length === DROPPED_FRAMES_CONSECUTIVE_WINDOWS
    && latest.every(window => window.valid
      && window.totalFrames > 0
      && window.droppedFrames / window.totalFrames > DROPPED_FRAMES_RATIO);
}

/**
 * == VIDEO PRODUCES NO FRAMES ==
 */

/**
 * One sample of the media time and of whether the video presented a frame
 */
export interface FrameProgressSample {
  readonly mediaTime: number;
  /**
   * Whether a video frame was presented since the element started loading the source
   */
  readonly presented: boolean;
  /**
   * Whether the sample can be trusted: the tab is visible (engines stop decoding hidden video) and the element is not
   * seeking
   */
  readonly valid: boolean;
}

/**
 * The media time the count of media time without any frame started at
 */
export interface FrameProgress {
  readonly since: number;
}

/**
 * Whether the video produces no frames: it fires when, since the load started, no frame was ever presented while the
 * media time advanced {@link FRAMES_STALL_MEDIA_SECONDS} (a browser that claims a codec it cannot decode plays the time
 * and the audio, with no picture and no error). Once a frame was presented it never fires for that load: a video with
 * few frames (stills, slideshows, screen recordings) legitimately goes much longer without a new one, and a decoder
 * that stops on the way raises a media error. A sample that cannot be trusted, or a media time going backwards (a
 * seek), starts the count again.
 *
 * @param previous - The progress returned for the previous sample (undefined at first)
 * @param sample - The new sample
 */
export function stepFrameProgress(
  previous: FrameProgress | undefined,
  sample: FrameProgressSample
): { progress: FrameProgress | undefined; stalled: boolean } {
  if (!sample.valid || sample.presented) {
    return { progress: undefined, stalled: false };
  }

  if (!previous || sample.mediaTime < previous.since) {
    return { progress: { since: sample.mediaTime }, stalled: false };
  }

  return { progress: previous, stalled: sample.mediaTime - previous.since >= FRAMES_STALL_MEDIA_SECONDS };
}

/**
 * == NETWORK ==
 */

/**
 * What the network supervisor observes:
 * - `stall`: a buffering stall that was not caused by a seek or by loading a new source, reported while it goes on
 * and when it ends
 * - `sample`: whether the element is paused, the network estimate (bits per second; undefined when there is none), the
 * buffer ahead of the playback position (seconds) and the bitrate the next level up needs (undefined when there is
 * nothing above)
 */
export type NetworkEvent
  = | { readonly type: 'stall'; readonly startedAt: number; readonly at: number; readonly ended: boolean }
    | {
      readonly type: 'sample';
      readonly at: number;
      readonly paused: boolean;
      readonly estimate?: number;
      readonly bufferAhead: number;
      readonly upBitrate?: number;
    };

/**
 * What the network supervisor remembers between events
 */
export interface NetworkMemory {
  /**
   * When the counted stalls ended, within {@link NETWORK_STALL_WINDOW_MS}
   */
  readonly stalls: readonly number[];
  /**
   * Since when the margin to move up holds
   */
  readonly marginSince?: number;
  /**
   * When the playback started or the level last changed
   */
  readonly lastChangeAt: number;
  /**
   * The start of the stall that already moved down while it was going on
   */
  readonly reportedStall?: number;
}

export type NetworkDecision = 'down' | 'up' | undefined;

/**
 * The memory of a playback that starts, or whose level just changed, at `at`
 */
export function startNetworkMemory(at: number, reportedStall?: number): NetworkMemory {
  return { stalls: [], lastChangeAt: at, reportedStall };
}

/**
 * Whether the estimate and the buffer keep the margin over the next level up. A paused playback never does: its buffer
 * fills while nothing plays, which says nothing about whether the network carries the level, and moving up would
 * replace the stream (and throw that buffer away) with no one watching.
 */
function hasUpMargin(event: Extract<NetworkEvent, { type: 'sample' }>): boolean {
  return !event.paused
    && event.upBitrate !== undefined
    && (event.estimate ?? 0) >= NETWORK_UP_FACTOR * event.upBitrate
    && event.bufferAhead >= NETWORK_UP_MIN_BUFFER_S;
}

/**
 * The network supervisor's logic for one event:
 * - down: {@link NETWORK_STALL_COUNT} stalls of at least {@link NETWORK_STALL_MIN_MS} within
 * {@link NETWORK_STALL_WINDOW_MS}, or one stall that lasts {@link NETWORK_LONG_STALL_MS} (while it goes on)
 * - up: the estimate is at least {@link NETWORK_UP_FACTOR} times the bitrate of the next level and the buffer at least
 * {@link NETWORK_UP_MIN_BUFFER_S} for {@link NETWORK_UP_SUSTAIN_MS} without a stall or a pause, and at least
 * {@link NETWORK_UP_HOLD_MS} passed since the last change: a pause starts the sustain time again from the resume
 * After a decision the memory starts again.
 *
 * @param memory - What was remembered so far
 * @param event - What was observed
 */
export function stepNetwork(memory: NetworkMemory, event: NetworkEvent): { memory: NetworkMemory; decision: NetworkDecision } {
  if (event.type === 'stall') {
    if (memory.reportedStall === event.startedAt) {
      return { memory, decision: undefined };
    }

    const duration = event.at - event.startedAt;

    if (!event.ended) {
      return duration >= NETWORK_LONG_STALL_MS
        ? { memory: startNetworkMemory(event.at, event.startedAt), decision: 'down' }
        : { memory: { ...memory, marginSince: undefined }, decision: undefined };
    }

    const stalls = [
      ...memory.stalls.filter(at => event.at - at < NETWORK_STALL_WINDOW_MS),
      ...(duration >= NETWORK_STALL_MIN_MS ? [event.at] : [])
    ];

    return stalls.length >= NETWORK_STALL_COUNT
      ? { memory: startNetworkMemory(event.at), decision: 'down' }
      : { memory: { ...memory, stalls, marginSince: undefined }, decision: undefined };
  }

  if (!hasUpMargin(event)) {
    return { memory: { ...memory, marginSince: undefined }, decision: undefined };
  }

  const marginSince = memory.marginSince ?? event.at;

  if (event.at - marginSince >= NETWORK_UP_SUSTAIN_MS && event.at - memory.lastChangeAt >= NETWORK_UP_HOLD_MS) {
    return { memory: startNetworkMemory(event.at), decision: 'up' };
  }

  return { memory: { ...memory, marginSince }, decision: undefined };
}
