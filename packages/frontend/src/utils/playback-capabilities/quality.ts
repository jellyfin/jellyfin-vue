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
 * The size of a video stream, as the server reports it
 */
export type VideoSize = Pick<MediaStream, 'Width' | 'Height'>;

/**
 * Returns the size as positive numbers, or undefined when unknown
 */
function getKnownSize(video?: VideoSize): { width: number; height: number } | undefined {
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
export function exceedsLevel(video: VideoSize, level: QualityLevel): boolean {
  const size = getKnownSize(video);

  return size ? !fits(size, level) : false;
}

/**
 * The level a source belongs to, which names it in the quality menu: the smallest level of the ladder it fits (see
 * {@link fits}, the same rule that decides whether a level encodes it). Undefined when the size is unknown or when the
 * source is larger than the top of the ladder.
 */
export function getSourceLevel(video?: VideoSize): QualityLevel | undefined {
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
export function getAvailableLevels(video?: VideoSize): QualityLevel[] {
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
export function getQualityMenu(video?: VideoSize): QualityMenuEntry[] {
  return ['auto', 'original', ...getAvailableLevels(video)];
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
export function getTranscodeLevel(video: VideoSize | undefined, cap?: QualityLevel): QualityLevel {
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
  video: VideoSize | undefined,
  mode: Extract<QualityMode, { type: 'auto' }>,
  videoTranscoded: boolean
): 'original' | QualityLevel {
  if (!video || !videoTranscoded) {
    return 'original';
  }

  return getTranscodeLevel(video, mode.level);
}

/**
 * The next level below the current one, for the runtime supervisors.
 *
 * @param current - The current cap; undefined (or the source's own level) means the original
 * @param video - The video stream being played
 * @returns The next level down, or undefined if there is none
 */
export function getNextLowerLevel(current: QualityLevel | undefined, video?: VideoSize): QualityLevel | undefined {
  const levels = getAvailableLevels(video);
  const sourceLevel = getSourceLevel(video);
  const effective = current ?? sourceLevel;

  if (effective === undefined) {
    return levels[0];
  }

  return levels.find(level => level < effective);
}

/**
 * The next level above the current one, for the runtime supervisors.
 *
 * @param current - The current cap
 * @param video - The video stream being played
 * @returns The next level up, or undefined when going up removes the cap (back to the original)
 */
export function getNextHigherLevel(current: QualityLevel, video?: VideoSize): QualityLevel | undefined {
  const sourceLevel = getSourceLevel(video);
  const next = getAvailableLevels(video).findLast(level => level > current);

  if (next === undefined || next === sourceLevel) {
    return;
  }

  return next;
}

/**
 * The caps sent to the server for a level. For portrait sources the box is turned, so the video is
 * not shrunk to fit sideways.
 */
export function getRequestCaps(level: QualityLevel, video?: VideoSize): RequestCaps {
  const entry = getEntry(level);
  const size = getKnownSize(video);
  const portrait = size !== undefined && size.height > size.width;

  return {
    maxBitrate: entry.bitrate,
    maxWidth: portrait ? entry.height : entry.width,
    maxHeight: portrait ? entry.width : entry.height
  };
}
