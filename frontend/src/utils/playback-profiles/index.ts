import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client';
import { getCodecProfiles } from './helpers/codec-profiles';
import { getDirectPlayProfiles } from './directplay-profile';
import { getTranscodingProfiles } from './transcoding-profile';
import { getSubtitleProfiles } from './subtitle-profile';
import { getResponseProfiles } from './response-profile';

/**
 * Creates a device profile containing supported codecs for the active Cast device.
 *
 * @param videoTestElement - Dummy video element for compatibility tests
 * @returns Device profile.
 */
function getDeviceProfile(videoTestElement: HTMLVideoElement): DeviceProfile {
  // MaxStaticBitrate seems to be for offline sync only
  return {
    MaxStreamingBitrate: 120_000_000,
    MaxStaticBitrate: 0,
    MusicStreamingTranscodingBitrate: Math.min(120_000_000, 192_000),
    DirectPlayProfiles: getDirectPlayProfiles(videoTestElement),
    TranscodingProfiles: getTranscodingProfiles(videoTestElement),
    ContainerProfiles: [],
    CodecProfiles: getCodecProfiles(videoTestElement),
    SubtitleProfiles: getSubtitleProfiles(),
    ResponseProfiles: getResponseProfiles()
  };
}

const videoTestElement = document.createElement('video');
const playbackProfile = getDeviceProfile(videoTestElement);

export default playbackProfile;
