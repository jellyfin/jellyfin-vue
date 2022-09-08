import {
  SubtitleDeliveryMethod,
  SubtitleProfile
} from '@jellyfin/client-axios';

/**
 * Returns a valid SubtitleProfile for the current platform.
 *
 * @returns {Array<SubtitleProfile>} An array of subtitle profiles for the current platform.
 */
export function getSubtitleProfiles(): Array<SubtitleProfile> {
  const SubtitleProfiles: Array<SubtitleProfile> = [];

  SubtitleProfiles.push({
    Format: 'vtt',
    Method: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'ass',
    Method: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'ssa',
    Method: SubtitleDeliveryMethod.External
  });

  return SubtitleProfiles;
}
