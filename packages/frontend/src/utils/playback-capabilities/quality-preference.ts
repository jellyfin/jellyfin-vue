/**
 * The quality the user prefers on this device, as the playback settings store it: one of the quality menu's
 * entries ("Automatic", "Original" or a height of the ladder), so the settings page and the player menu write
 * the same value. A resolution acts as a cap: files below it play at their own quality.
 */
import { QUALITY_LADDER } from './constants.ts';
import { getSourceLevel, type QualityLevel, type QualityMenuEntry, type QualityMode, type VideoInfo } from './quality.ts';

/**
 * The preference of a new device, and of a device whose stored value is not valid
 */
export const DEFAULT_QUALITY_PREFERENCE = 'auto' satisfies QualityMenuEntry;

/**
 * Whether a value is one of the quality menu's entries
 */
function isQualityMenuEntry(value: unknown): value is QualityMenuEntry {
  return value === 'auto' || value === 'original' || QUALITY_LADDER.some(entry => entry.height === value);
}

/**
 * Reads a stored preference. Storage is not validated when it is loaded, so anything that is not a menu entry
 * (a corrupted value, or one written by another version of the client) falls back to Automatic instead of
 * reaching playback.
 */
export function parseQualityPreference(value: unknown): QualityMenuEntry {
  return isQualityMenuEntry(value) ? value : DEFAULT_QUALITY_PREFERENCE;
}

/**
 * The quality mode a preference means for one media source:
 * - Automatic starts without a cap; the level it runs at during a playback belongs to the runtime supervisors
 * - Original is Original, for video and music alike
 * - a resolution locks the quality at that level, lowered to the source's own level when the source is smaller,
 * so the file plays at its own quality and the mode is one of the levels the file's quality menu offers.
 * A video of unknown size, or larger than the ladder, keeps the resolution as its cap.
 * - for an item without video (music) a resolution means nothing and the menu has none, so it is Automatic
 *
 * @param preference - The stored preference (see {@link parseQualityPreference})
 * @param video - The video stream of the media source; undefined for music
 */
export function getPreferredQualityMode(preference: QualityMenuEntry, video?: VideoInfo): QualityMode {
  if (preference === 'original') {
    return { type: 'original' };
  }

  if (preference === 'auto' || !video) {
    return { type: 'auto' };
  }

  const sourceLevel = getSourceLevel(video);

  return { type: 'fixed', level: sourceLevel === undefined ? preference : Math.min(preference, sourceLevel) as QualityLevel };
}
