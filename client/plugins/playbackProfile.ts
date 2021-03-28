import { Context, Plugin } from '@nuxt/types';
import { DeviceProfile } from '@jellyfin/client-axios';
import { getCodecProfiles } from './playbackProfiles/helpers/codecProfiles';
import { getDirectPlayProfiles } from './playbackProfiles/directPlayProfile';
import { getTranscodingProfiles } from './playbackProfiles/transcodingProfile';
import { getSubtitleProfiles } from './playbackProfiles/subtitleProfile';
import { getResponseProfiles } from './playbackProfiles/responseProfile';

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

/**
 * Creates a device profile containing supported codecs for the active Cast device.
 *
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - Dummy video element for compatibility tests
 * @returns {object} Device profile.
 */
function getDeviceProfile(
  context: Context,
  videoTestElement: HTMLVideoElement
): DeviceProfile {
  // MaxStaticBitrate seems to be for offline sync only
  return {
    MaxStreamingBitrate: 120000000,
    MaxStaticBitrate: 0,
    MusicStreamingTranscodingBitrate: Math.min(120000000, 192000),
    DirectPlayProfiles: getDirectPlayProfiles(context, videoTestElement),
    TranscodingProfiles: getTranscodingProfiles(context, videoTestElement),
    ContainerProfiles: [],
    CodecProfiles: getCodecProfiles(context, videoTestElement),
    SubtitleProfiles: getSubtitleProfiles(),
    ResponseProfiles: getResponseProfiles()
  };
}

const playbackProfilePlugin: Plugin = (context, inject) => {
  const videoTestElement = document.createElement('video');

  inject('playbackProfile', getDeviceProfile(context, videoTestElement));
};

export default playbackProfilePlugin;
