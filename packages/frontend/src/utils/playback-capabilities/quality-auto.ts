/**
 * Automatic quality: the level it runs at during one playback, and how the runtime supervisors move it.
 *
 * - It starts from the network estimate remembered for the session (no cap without one).
 * - When the playback is not smooth it moves down, never back up for that reason: first the video is encoded at the
 * same resolution (decoding the encoded video is cheaper than decoding the original), then one level at a time.
 * - When the network cannot keep up it moves down to what the estimate carries, and back up one level at a time when
 * the estimate keeps a wide margin (the margin itself is judged by `runtime-signals.ts`). A level it moved down from
 * is not tried again for a while, longer after each time (see `rememberStall`).
 */
import { NETWORK_DOWN_FACTOR, NETWORK_RETRY_WAIT_MS } from './constants.ts';
import {
  exceedsQuality,
  getAvailableLevels,
  getLevelBitrate,
  getNextHigherLevel,
  getNextLowerLevel,
  getSourceLevel,
  type QualityLevel,
  type QualityMode,
  type VideoInfo
} from './quality.ts';

/**
 * A stream the network supervisor moved down from during the playback: the level its video was encoded at as asked
 * for, or `top` for the original
 */
export interface StalledLevel {
  readonly level: QualityLevel | 'top';
  /**
   * Before this time (on the clock of the supervisor's samples, in milliseconds) Automatic does not move up to it, nor
   * above it
   */
  readonly retryAt: number;
  /**
   * How many times the network supervisor moved down from it
   */
  readonly failures: number;
}

/**
 * The state of Automatic for one playback:
 * - `level`: the cap (none means the original, when it plays)
 * - `encodeVideo`: the smoothness supervisor asked for the video to be encoded
 * - `ceiling`: the highest the network may raise it to after the smoothness supervisor lowered it; `source` is the
 * source's own level, encoded
 * - `stalled`: the streams the network supervisor moved down from (see `rememberStall`)
 */
export interface AutoState {
  readonly level?: QualityLevel;
  readonly encodeVideo: boolean;
  readonly ceiling?: QualityLevel | 'source';
  readonly stalled?: readonly StalledLevel[];
}

/**
 * Automatic before anything is known: no cap
 */
export const AUTO_START: AutoState = Object.freeze({ encodeVideo: false });

/**
 * The quality mode a state of Automatic means for the verdict
 */
export function getAutoMode(state: AutoState): Extract<QualityMode, { type: 'auto' }> {
  return {
    type: 'auto',
    ...(state.level !== undefined && { level: state.level }),
    ...(state.encodeVideo && { encodeVideo: true })
  };
}

/**
 * The bitrate encoding at a level takes: the bitrate the level asks for at the source's frame rate
 * (`getLevelBitrate`), never above the source's (the server does not encode above it)
 */
function getEncodedBitrate(level: QualityLevel, video?: VideoInfo): number {
  const levelBitrate = getLevelBitrate(level, video);

  return typeof video?.BitRate === 'number' ? Math.min(levelBitrate, video.BitRate) : levelBitrate;
}

/**
 * The levels below a position, highest first: below the level the video is encoded at, or, from the original, every
 * level that encodes it (the source's own level only when its bitrate is above the level's)
 */
function getLevelsBelow(video: VideoInfo, encodedAt: QualityLevel | undefined): QualityLevel[] {
  const levels = getAvailableLevels(video);

  if (encodedAt !== undefined) {
    return levels.filter(level => level < encodedAt);
  }

  return levels.filter(level => exceedsQuality(video, { type: 'auto', level }));
}

/**
 * The highest of the candidate levels the estimate carries, or the lowest one when it carries none
 */
function pickByEstimate(candidates: QualityLevel[], video: VideoInfo, estimate: number): QualityLevel | undefined {
  const usable = estimate * NETWORK_DOWN_FACTOR;

  return candidates.find(level => getEncodedBitrate(level, video) <= usable) ?? candidates.at(-1);
}

/**
 * The state a playback starts with: without a network estimate, or when the estimate carries the source, no cap;
 * otherwise the highest level the estimate carries (the lowest one when it carries none). A source of unknown bitrate
 * is not capped when the estimate carries its own level.
 *
 * @param video - The video stream (undefined for music)
 * @param estimate - The network estimate remembered for the session, in bits per second
 */
export function getAutoStartState(video: VideoInfo | undefined, estimate: number | undefined): AutoState {
  if (!video || estimate === undefined) {
    return AUTO_START;
  }

  const usable = estimate * NETWORK_DOWN_FACTOR;
  const sourceLevel = getSourceLevel(video);
  const carriesSource = typeof video.BitRate === 'number'
    ? video.BitRate <= usable
    : sourceLevel === undefined || getLevelBitrate(sourceLevel, video) <= usable;

  if (carriesSource) {
    return AUTO_START;
  }

  const level = pickByEstimate(getLevelsBelow(video, undefined), video, estimate);

  return level === undefined ? AUTO_START : { level, encodeVideo: false };
}

/**
 * The next state when the playback is not smooth: the original is encoded at the same resolution (the current cap,
 * or the source's own level), an encoded video goes one level down. It never goes back above the new state.
 *
 * @param state - The current state
 * @param video - The video stream (undefined for music)
 * @param encodedAt - The level the video is encoded at; undefined when the picture is not encoded
 * @param mayEncodeVideo - Whether the user's policy lets the server encode the video: every step encodes it, so
 * without it there is none (the manager would refuse it as unplayable)
 * @returns The next state, or undefined when there is nothing below
 */
export function getSmoothnessStep(
  state: AutoState,
  video: VideoInfo | undefined,
  encodedAt: QualityLevel | undefined,
  mayEncodeVideo: boolean
): AutoState | undefined {
  if (!video || !mayEncodeVideo) {
    return;
  }

  const stalled = state.stalled && { stalled: state.stalled };

  if (encodedAt === undefined) {
    return { ...(state.level !== undefined && { level: state.level }), encodeVideo: true, ceiling: state.level ?? 'source', ...stalled };
  }

  const next = getNextLowerLevel(encodedAt, video);

  return next === undefined ? undefined : { level: next, encodeVideo: true, ceiling: next, ...stalled };
}

/**
 * The next state when the network cannot keep up: below what is playing, at the highest level the estimate carries
 * (one level down without an estimate)
 *
 * @param state - The current state
 * @param video - The video stream
 * @param encodedAt - The level the video is encoded at; undefined when the picture is not encoded
 * @param estimate - The network estimate, in bits per second (undefined when there is none)
 * @param mayEncodeVideo - Whether the user's policy lets the server encode the video: every level below what plays
 * encodes it, so without it there is none (the manager would refuse the step as unplayable)
 * @returns The next state, or undefined when there is nothing below
 */
export function getDownStep(
  state: AutoState,
  video: VideoInfo,
  encodedAt: QualityLevel | undefined,
  estimate: number | undefined,
  mayEncodeVideo: boolean
): AutoState | undefined {
  if (!mayEncodeVideo) {
    return;
  }

  const candidates = getLevelsBelow(video, encodedAt);
  const level = estimate === undefined ? candidates[0] : pickByEstimate(candidates, video, estimate);

  return level === undefined ? undefined : { ...state, level };
}

/**
 * Remembers that the network supervisor moved down from a stream because of buffering stalls: Automatic does not move
 * up to that stream, nor above it, for {@link NETWORK_RETRY_WAIT_MS}, twice as long after each step down from it during
 * the playback. The network estimate cannot tell when the network is not what stalled: a server that encodes the upper
 * level slower than real time serves the lower one ahead of time, so the estimate there measures the network and keeps
 * a wide margin, and without this the upper level would be tried again, and stall again, every time the margin held.
 *
 * The stream is named by the level its video was encoded at as asked for, not by the cap: an uncapped encode (the
 * codec forces it) is the source's own level, the same stream the cap at that level asks for.
 *
 * @param from - The state that stalled
 * @param next - The state the network supervisor moves down to (`getDownStep`)
 * @param encodedAt - The level the video that stalled was encoded at as asked for; undefined when it was the original
 * @param at - When, on the clock of the supervisor's samples (milliseconds)
 */
export function rememberStall(from: AutoState, next: AutoState, encodedAt: QualityLevel | undefined, at: number): AutoState {
  const level = encodedAt ?? 'top';
  const failures = (from.stalled?.find(entry => entry.level === level)?.failures ?? 0) + 1;

  return {
    ...next,
    stalled: [
      ...(from.stalled ?? []).filter(entry => entry.level !== level),
      { level, retryAt: at + (NETWORK_RETRY_WAIT_MS * 2 ** (failures - 1)), failures }
    ]
  };
}

/**
 * Whether a step up to `target` would ask for a stream the network supervisor moved down from (or one above it) before
 * its time to be tried again
 */
function isWaitingAfterStall(state: AutoState, target: QualityLevel | 'top', at: number): boolean {
  const rank = (level: QualityLevel | 'top'): number => level === 'top' ? Infinity : level;

  return state.stalled?.some(entry => at < entry.retryAt && rank(target) >= rank(entry.level)) ?? false;
}

/**
 * One step up from a level: a level, or `top` (no cap)
 */
type UpTarget = QualityLevel | 'top';

/**
 * Where one step up goes, never above the ceiling the smoothness supervisor set
 */
function getUpTarget(state: AutoState, video: VideoInfo, encodedAt: QualityLevel): UpTarget | undefined {
  const next: UpTarget = getNextHigherLevel(encodedAt, video) ?? 'top';
  const { ceiling } = state;

  if (ceiling === undefined) {
    return next;
  }

  if (ceiling === 'source') {
    return encodedAt === getSourceLevel(video) ? undefined : next;
  }

  if (encodedAt >= ceiling) {
    return;
  }

  return next === 'top' || next > ceiling ? ceiling : next;
}

/**
 * The bitrate without a cap: the source's own level encoded (when the smoothness supervisor asked for the video to
 * be encoded) or the original
 */
function getTopBitrate(state: AutoState, video: VideoInfo, encodedAt: QualityLevel): number {
  const sourceLevel = getSourceLevel(video);

  if (state.encodeVideo && sourceLevel !== undefined) {
    return getEncodedBitrate(sourceLevel, video);
  }

  return typeof video.BitRate === 'number' ? video.BitRate : getLevelBitrate(sourceLevel ?? encodedAt, video);
}

/**
 * The state one step up from what is playing, with the bitrate the network has to carry for it. Never above the
 * ceiling the smoothness supervisor set, nor to a stream the network supervisor moved down from (or above it) before
 * its time to be tried again (`rememberStall`).
 *
 * @param state - The current state
 * @param video - The video stream
 * @param encodedAt - The level the video is encoded at as asked for (the server may deliver less, which must not
 * make it ask for the same stream again); undefined when the picture is not encoded (nothing above)
 * @param at - Now, on the clock of the supervisor's samples (milliseconds)
 */
export function getUpStep(
  state: AutoState,
  video: VideoInfo,
  encodedAt: QualityLevel | undefined,
  at: number
): { state: AutoState; bitrate: number } | undefined {
  if (encodedAt === undefined) {
    return;
  }

  const target = getUpTarget(state, video, encodedAt);

  if (target === undefined || isWaitingAfterStall(state, target, at)) {
    return;
  }

  if (target !== 'top') {
    return { state: { ...state, level: target }, bitrate: getEncodedBitrate(target, video) };
  }

  // Already uncapped: the video is encoded for another reason (its codec, say), and asking again changes nothing
  if (state.level === undefined) {
    return;
  }

  const top: AutoState = state.encodeVideo ? { encodeVideo: true, ...(state.ceiling !== undefined && { ceiling: state.ceiling }) } : AUTO_START;

  return { state: { ...top, ...(state.stalled && { stalled: state.stalled }) }, bitrate: getTopBitrate(state, video, encodedAt) };
}
