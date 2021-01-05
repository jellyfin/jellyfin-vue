import { Plugin } from '@nuxt/types/app';
import { DeviceProfile } from '@jellyfin/client-axios';
import { getCodecProfiles } from '~/utils/playbackProfiles/helpers/codecProfiles';
import { getDirectPlayProfiles } from '~/utils/playbackProfiles/directPlayProfile';
import { getTranscodingProfiles } from '~/utils/playbackProfiles/transcodingProfile';
import { getSubtitleProfiles } from '~/utils/playbackProfiles/subtitleProfile';
import { getResponseProfiles } from '~/utils/playbackProfiles/responseProfile';

declare module '@nuxt/types' {
  interface Context {
    $playbackProfile: DeviceProfile;
  }

  interface NuxtAppOptions {
    $playbackProfile: DeviceProfile;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $playbackProfile: DeviceProfile;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $playbackProfile: DeviceProfile;
  }
}

const videoTestElement = document.createElement('video');

/**
 * Creates a device profile containing supported codecs for the active Cast device.
 *
 * @returns {object} Device profile.
 */
function getDeviceProfile(): DeviceProfile {
  // MaxStaticBitrate seems to be for offline sync only
  return {
    MaxStreamingBitrate: 120000000,
    MaxStaticBitrate: 0,
    MusicStreamingTranscodingBitrate: Math.min(120000000, 192000),
    DirectPlayProfiles: getDirectPlayProfiles(videoTestElement),
    TranscodingProfiles: getTranscodingProfiles(videoTestElement),
    ContainerProfiles: [],
    CodecProfiles: getCodecProfiles(videoTestElement),
    SubtitleProfiles: getSubtitleProfiles(),
    ResponseProfiles: getResponseProfiles()
  };
}

const playbackProfilePlugin: Plugin = (_context, inject) => {
  inject('playbackProfile', getDeviceProfile());
};

export default playbackProfilePlugin;
