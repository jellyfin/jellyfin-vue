/**
 * Quality modes and levels, YouTube style: "Automatic", "Original" and one entry per resolution of the
 * ladder at or below the source. The bitrate of each level is internal; the server receives it together with the
 * box (maximum width and height) of the level.
 */
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { CODED_SIZE_ALIGNMENT, QUALITY_LADDER } from './constants.ts';

/**
 * One of the ladder's heights (2160, 1440, 1080, 720, 480 or 360)
 */
export type QualityLevel = typeof QUALITY_LADDER[number]['height'];

/**
 * The quality the user asked for:
 * - `auto`: everything is automatic; `level` is the cap the runtime supervisors currently impose (none at first)
 * - `original`: only the original file, played directly or remuxed
 * - `fixed`: the quality is locked to `level`
 */
export type QualityMode
  = | { readonly type: 'auto'; readonly level?: QualityLevel }
    | { readonly type: 'original' }
    | { readonly type: 'fixed'; readonly level: QualityLevel };

/**
 * What the quality menu can show: Automatic, Original or one of the ladder's heights
 */
export type QualityMenuEntry = 'auto' | 'original' | QualityLevel;

/**
 * The caps sent to the server so it encodes at a given level
 */
export interface RequestCaps {
  readonly maxBitrate: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
}

/**
 * The size and bitrate of a video stream, as the server reports them
 */
export type VideoInfo = Pick<MediaStream, 'Width' | 'Height' | 'BitRate'>;

/**
 * Returns the size as positive numbers, or undefined when unknown
 */
function getKnownSize(video?: VideoInfo): { width: number; height: number } | undefined {
  if (video?.Width && video.Height && video.Width > 0 && video.Height > 0) {
    return { width: video.Width, height: video.Height };
  }
}

/**
 * Gets the ladder entry of a level
 */
function getEntry(level: QualityLevel) {
  return QUALITY_LADDER.find(entry => entry.height === level)!;
}

/**
 * Whether a size fits a level, whatever its orientation: by its short side, which may be the level's height rounded up
 * to whole coding blocks (see {@link CODED_SIZE_ALIGNMENT}). A video only wider than the level's box (DCI, scope) fits.
 */
function fits(size: { width: number; height: number }, level: QualityLevel): boolean {
  return Math.min(size.width, size.height) <= Math.ceil(level / CODED_SIZE_ALIGNMENT) * CODED_SIZE_ALIGNMENT;
}

/**
 * Whether the source does not fit a level (see {@link fits}). A video of unknown size never exceeds a level.
 */
export function exceedsLevel(video: VideoInfo, level: QualityLevel): boolean {
  const size = getKnownSize(video);

  return size ? !fits(size, level) : false;
}

/**
 * The level a source belongs to, which names it in the quality menu: the smallest level of the ladder it fits (see
 * {@link fits}, the same rule that decides whether a level encodes it). Undefined when the size is unknown or when the
 * source is larger than the top of the ladder.
 */
export function getSourceLevel(video?: VideoInfo): QualityLevel | undefined {
  const size = getKnownSize(video);

  if (!size) {
    return;
  }

  return QUALITY_LADDER.findLast(entry => fits(size, entry.height))?.height;
}

/**
 * The levels that can be chosen for a source: its own level and every level below.
 * Audio-only items and videos of unknown size have none.
 */
export function getAvailableLevels(video?: VideoInfo): QualityLevel[] {
  if (!getKnownSize(video)) {
    return [];
  }

  const sourceLevel = getSourceLevel(video);

  return QUALITY_LADDER
    .map(entry => entry.height)
    .filter(height => sourceLevel === undefined || height <= sourceLevel);
}

/**
 * The entries of the quality menu for a source
 */
export function getQualityMenu(video?: VideoInfo): QualityMenuEntry[] {
  return ['auto', 'original', ...getAvailableLevels(video)];
}

/**
 * Whether a quality mode forces the video to be encoded:
 * - a fixed level only looks at resolution: a source that fits it is never encoded, whatever its bitrate
 * - Automatic with a current level also encodes a source whose bitrate is above the level's internal one,
 * since it lowers levels for bandwidth reasons (so "the source's resolution at the ladder bitrate" is a step)
 * - Automatic without a level and Original never force anything
 */
export function exceedsQuality(video: VideoInfo, mode: QualityMode): boolean {
  if (mode.type === 'original' || mode.level === undefined) {
    return false;
  }

  if (exceedsLevel(video, mode.level)) {
    return true;
  }

  return mode.type === 'auto' && typeof video.BitRate === 'number' && video.BitRate > getEntry(mode.level).bitrate;
}

/**
 * The cap a quality mode imposes, if any
 */
export function getModeLevel(mode: QualityMode): QualityLevel | undefined {
  return mode.type === 'original' ? undefined : mode.level;
}

/**
 * The level the server encodes at when the video has to be transcoded: the cap of the mode, never above the
 * source's own level (no upscaling), and never above the top of the ladder.
 */
export function getTranscodeLevel(video: VideoInfo | undefined, cap?: QualityLevel): QualityLevel {
  const ceiling = getSourceLevel(video) ?? QUALITY_LADDER[0].height;

  return cap === undefined ? ceiling : Math.min(cap, ceiling) as QualityLevel;
}

/**
 * The menu entry equivalent to what "Automatic" is currently running: `original` when the video is not
 * encoded, otherwise the level it is encoded at.
 *
 * @param video - The video stream being played (undefined for music)
 * @param mode - The automatic mode, with the cap currently in place
 * @param videoTranscoded - Whether the server is encoding the video
 */
export function getAutoRunningEntry(
  video: VideoInfo | undefined,
  mode: Extract<QualityMode, { type: 'auto' }>,
  videoTranscoded: boolean
): 'original' | QualityLevel {
  if (!video || !videoTranscoded) {
    return 'original';
  }

  return getTranscodeLevel(video, mode.level);
}

/**
 * Whether Automatic at the source's own level would still encode the video (its bitrate is above the level's)
 */
function isOwnLevelAStep(video: VideoInfo | undefined, sourceLevel: QualityLevel | undefined): sourceLevel is QualityLevel {
  return video !== undefined && sourceLevel !== undefined && exceedsQuality(video, { type: 'auto', level: sourceLevel });
}

/**
 * The next level below the current one, for the runtime supervisors of Automatic. From the original, the first
 * step is the source's own level when its bitrate is above that level's (same resolution, ladder bitrate);
 * otherwise it is the level below.
 *
 * @param current - The current cap; undefined (or a level at or above the source's) means the original
 * @param video - The video stream being played
 * @returns The next level down, or undefined if there is none
 */
export function getNextLowerLevel(current: QualityLevel | undefined, video?: VideoInfo): QualityLevel | undefined {
  const levels = getAvailableLevels(video);
  const sourceLevel = getSourceLevel(video);
  const isOriginal = current === undefined || (sourceLevel !== undefined && current > sourceLevel);

  if (isOriginal && isOwnLevelAStep(video, sourceLevel)) {
    return sourceLevel;
  }

  const effective = isOriginal ? sourceLevel : current;

  if (effective === undefined) {
    return levels[0];
  }

  return levels.find(level => level < effective);
}

/**
 * The next level above the current one, for the runtime supervisors of Automatic.
 *
 * @param current - The current cap
 * @param video - The video stream being played
 * @returns The next level up, or undefined when going up removes the cap (back to the original)
 */
export function getNextHigherLevel(current: QualityLevel, video?: VideoInfo): QualityLevel | undefined {
  const sourceLevel = getSourceLevel(video);
  const next = getAvailableLevels(video).findLast(level => level > current);

  if (next === undefined || (next === sourceLevel && !isOwnLevelAStep(video, sourceLevel))) {
    return;
  }

  return next;
}

/**
 * The caps sent to the server for a level. For portrait sources the box is turned, so the video is
 * not shrunk to fit sideways.
 */
export function getRequestCaps(level: QualityLevel, video?: VideoInfo): RequestCaps {
  const entry = getEntry(level);
  const size = getKnownSize(video);
  const portrait = size !== undefined && size.height > size.width;

  return {
    maxBitrate: entry.bitrate,
    maxWidth: portrait ? entry.height : entry.width,
    maxHeight: portrait ? entry.width : entry.height
  };
}
