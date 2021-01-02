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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (typeof video.webkitSupportsPresentationMode === 'function' &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      video.webkitSupportsPresentationMode('picture-in-picture') &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typeof video.webkitSetPresentationMode === 'function') ||
    // Check standard PiP support
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
