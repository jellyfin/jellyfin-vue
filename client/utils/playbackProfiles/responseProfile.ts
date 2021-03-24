import { DlnaProfileType, ResponseProfile } from '@jellyfin/client-axios';

/**
 * Returns a valid ResponseProfile for the current platform.
 *
 * @returns {Array<ResponseProfile>} An array of subtitle profiles for the current platform.
 */
export function getResponseProfiles(): Array<ResponseProfile> {
  const ResponseProfiles = [];

  ResponseProfiles.push({
    Type: DlnaProfileType.Video,
    Container: 'm4v',
    MimeType: 'video/mp4'
  });

  return ResponseProfiles;
}
