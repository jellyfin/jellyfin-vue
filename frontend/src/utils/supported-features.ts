import {
  isTv,
  isApple,
  isChrome,
  isEdge,
  isChromiumBased
} from '@/utils/browser-detection';

export interface SupportedFeatures {
  pictureInPicture: boolean;
  airPlay: boolean;
  googleCast: boolean;
  playbackRate: boolean;
  fullScreen: boolean;
}

const supportedFeatures: SupportedFeatures = {
  pictureInPicture: false,
  airPlay: false,
  googleCast: false,
  playbackRate: false,
  fullScreen: false
};

/**
 * Detects if the current platform supports showing fullscreen videos
 *
 * @returns - Whether fullscreen is supported or not
 */
function supportsFullscreen(): boolean {
  // TVs don't support fullscreen.
  if (isTv()) {
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
  document.pictureInPictureEnabled
) {
  supportedFeatures.pictureInPicture = true;
}

if (typeof video.playbackRate === 'number') {
  supportedFeatures.playbackRate = true;
}

if (supportsFullscreen()) {
  supportedFeatures.fullScreen = true;
}

if (isApple()) {
  supportedFeatures.airPlay = true;
}

if (isChrome() || (isEdge() && isChromiumBased())) {
  supportedFeatures.googleCast = true;
}

export default supportedFeatures;
