/**
 * @deprecated - Check #/utils/playback-profiles/index
 */

import {
  SubtitleDeliveryMethod,
  type SubtitleProfile
} from '@jellyfin/sdk/lib/generated-client';

/**
 * Returns a valid SubtitleProfile for the current platform.
 *
 * @returns An array of subtitle profiles for the current platform.
 */
export function getSubtitleProfiles(): SubtitleProfile[] {
  const SubtitleProfiles: SubtitleProfile[] = [];

  SubtitleProfiles.push(
    {
      Format: 'vtt',
      Method: SubtitleDeliveryMethod.External
    },
    {
      Format: 'ass',
      Method: SubtitleDeliveryMethod.External
    },
    {
      Format: 'ssa',
      Method: SubtitleDeliveryMethod.External
    },
    {
      Format: 'pgssub',
      Method: SubtitleDeliveryMethod.External
    }
  );

  return SubtitleProfiles;
}
