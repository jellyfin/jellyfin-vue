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
  // TODO: Uncomment when proper subtitle support is added
  const SubtitleProfiles: Array<SubtitleProfile> = [];

  // SubtitleProfiles.push({
  //   Format: 'ttml',
  //   Method: SubtitleDeliveryMethod.External
  // });

  SubtitleProfiles.push({
    Format: 'vtt',
    Method: SubtitleDeliveryMethod.External
  });

  // SubtitleProfiles.push({
  //   Format: 'subrip',
  //   Method: SubtitleDeliveryMethod.External
  // });

  SubtitleProfiles.push({
    Format: 'ass',
    Method: SubtitleDeliveryMethod.Encode
  });

  SubtitleProfiles.push({
    Format: 'ssa',
    Method: SubtitleDeliveryMethod.Encode
  });

  // SubtitleProfiles.push({
  //   Format: 'subviewer',
  //   Method: SubtitleDeliveryMethod.External
  // });

  return SubtitleProfiles;
}
