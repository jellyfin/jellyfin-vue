import { Plugin } from '@nuxt/types';

export interface SupportedFeatures {
  pictureInPicture: boolean;
  airPlay: boolean;
  googleCast: boolean;
  playbackRate: boolean;
  fullScreen: boolean;
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
    airPlay: false,
    googleCast: false,
    playbackRate: false,
    fullScreen: false
  };

  const video = document.createElement('video');

  /**
   * Detects if the current platform supports showing fullscreen videos
   *
   * @returns {boolean}
   */
  function supportsFullscreen(): boolean {
    // TVs don't support fullscreen. iOS, when user through the PWA, is already full screen.
    if ($browser.isTv() || ($browser.isApple() && $browser.isMobile())) {
      return false;
    }

    const element = document.documentElement;

    return !!(
      element.requestFullscreen ||
      // @ts-expect-error -- Non-standard property
      element.mozRequestFullScreen ||
      // @ts-expect-error -- Non-standard property
      element.webkitRequestFullscreen ||
      // @ts-expect-error -- Non-standard property
      element.msRequestFullscreen ||
      // @ts-expect-error -- Non-standard property
      document.createElement('video').webkitEnterFullscreen
    );
  }

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

  if (
    $browser.isChrome() ||
    ($browser.isEdge() && $browser.isChromiumBased())
  ) {
    supportedFeatures.googleCast = true;
  }

  if (supportsFullscreen()) {
    supportedFeatures.fullScreen = true;
  }

  if (typeof video.playbackRate === 'number') {
    supportedFeatures.playbackRate = true;
  }

  inject('features', supportedFeatures);
};

export default supportedFeaturesPlugin;
