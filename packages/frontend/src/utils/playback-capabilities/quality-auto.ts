/**
 * Automatic quality: the level it runs at during one playback, and how the runtime supervisors move it.
 *
 * - It starts from the network estimate remembered for the session (no cap without one).
 * - When the playback is not smooth it moves down, never back up for that reason: first the video is encoded at the
 * same resolution (decoding the encoded video is cheaper than decoding the original), then one level at a time.
 * - When the network cannot keep up it moves down to what the estimate carries, and back up one level at a time when
 * the estimate keeps a wide margin (the margin itself is judged by `runtime-signals.ts`).
 */
import { NETWORK_DOWN_FACTOR } from './constants.ts';
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
 * The state of Automatic for one playback:
 * - `level`: the cap (none means the original, when it plays)
 * - `encodeVideo`: the smoothness supervisor asked for the video to be encoded
 * - `ceiling`: the highest the network may raise it to after the smoothness supervisor lowered it; `source` is the
 * source's own level, encoded
 */
export interface AutoState {
  readonly level?: QualityLevel;
  readonly encodeVideo: boolean;
  readonly ceiling?: QualityLevel | 'source';
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
 * @returns The next state, or undefined when there is nothing below
 */
export function getSmoothnessStep(state: AutoState, video: VideoInfo | undefined, encodedAt: QualityLevel | undefined): AutoState | undefined {
  if (!video) {
    return;
  }

  if (encodedAt === undefined) {
    return { ...(state.level !== undefined && { level: state.level }), encodeVideo: true, ceiling: state.level ?? 'source' };
  }

  const next = getNextLowerLevel(encodedAt, video);

  return next === undefined ? undefined : { level: next, encodeVideo: true, ceiling: next };
}

/**
 * The next state when the network cannot keep up: below what is playing, at the highest level the estimate carries
 * (one level down without an estimate)
 *
 * @param state - The current state
 * @param video - The video stream
 * @param encodedAt - The level the video is encoded at; undefined when the picture is not encoded
 * @param estimate - The network estimate, in bits per second
 * @returns The next state, or undefined when there is nothing below
 */
export function getDownStep(state: AutoState, video: VideoInfo, encodedAt: QualityLevel | undefined, estimate?: number): AutoState | undefined {
  const candidates = getLevelsBelow(video, encodedAt);
  const level = estimate === undefined ? candidates[0] : pickByEstimate(candidates, video, estimate);

  return level === undefined ? undefined : { ...state, level };
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
 * ceiling the smoothness supervisor set.
 *
 * @param state - The current state
 * @param video - The video stream
 * @param encodedAt - The level the video is encoded at; undefined when the picture is not encoded (nothing above)
 */
export function getUpStep(state: AutoState, video: VideoInfo, encodedAt: QualityLevel | undefined): { state: AutoState; bitrate: number } | undefined {
  if (encodedAt === undefined) {
    return;
  }

  const target = getUpTarget(state, video, encodedAt);

  if (target === undefined) {
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

  return { state: top, bitrate: getTopBitrate(state, video, encodedAt) };
}
