import { Plugin } from '@nuxt/types';

export interface SupportedFeatures {
  pictureInPicture: boolean;
  airPlay: boolean;
}

declare module '@nuxt/types' {
  interface Context {
    $features: SupportedFeatures;
  }

  interface NuxtAppOptions {
    $features: SupportedFeatures;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $features: SupportedFeatures;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $features: SupportedFeatures;
  }
}

const supportedFeaturesPlugin: Plugin = ({ $browser }, inject) => {
  const supportedFeatures: SupportedFeatures = {
    pictureInPicture: false,
    airPlay: false
  };

  const video = document.createElement('video');

  if (
    // Check non-standard Safari PiP support
    // @ts-expect-error - Non-standard functions doesn't have typings
    (typeof video.webkitSupportsPresentationMode === 'function' &&
      // @ts-expect-error - Non-standard functions doesn't have typings
      video.webkitSupportsPresentationMode('picture-in-picture') &&
      // @ts-expect-error - Non-standard functions doesn't have typings
      typeof video.webkitSetPresentationMode === 'function') ||
    // Check standard PiP support
    // @ts-expect-error - Non-standard functions doesn't have typings
    document.pictureInPictureEnabled
  ) {
    supportedFeatures.pictureInPicture = true;
  }

  if ($browser.isApple()) {
    supportedFeatures.airPlay = true;
  }

  inject('features', supportedFeatures);
};

export default supportedFeaturesPlugin;
