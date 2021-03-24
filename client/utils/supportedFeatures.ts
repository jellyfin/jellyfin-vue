import { browserDetector } from '~/plugins/browserDetection';

export interface SupportedFeaturesInterface {
  pictureInPicture: boolean;
  airPlay: boolean;
  playbackRate: boolean;
}

export const getSupportedFeatures = (): SupportedFeaturesInterface => {
  const supportedFeatures = {
    pictureInPicture: false,
    airPlay: false,
    playbackRate: false
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

  if (browserDetector.isApple()) {
    supportedFeatures.airPlay = true;
  }

  if (typeof video.playbackRate === 'number') {
    supportedFeatures.playbackRate = true;
  }

  return supportedFeatures;
};
