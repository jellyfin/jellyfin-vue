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
  const SubtitleProfiles = [];

  SubtitleProfiles.push({
    Format: 'vtt',
    Method: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'ttml',
    Method: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'srt',
    Methood: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'ass',
    Methood: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'ssa',
    Methood: SubtitleDeliveryMethod.External
  });

  SubtitleProfiles.push({
    Format: 'subviewer',
    Methood: SubtitleDeliveryMethod.External
  });

  return SubtitleProfiles;
}
