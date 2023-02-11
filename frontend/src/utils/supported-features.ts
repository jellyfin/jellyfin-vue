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
  const video = document.createElement('video');

  return !!(
    element.requestFullscreen ||
    // check properties that are not recorded on the element type
    ('mozRequestFullScreen' in element && element.mozRequestFullScreen) ||
    ('webkitRequestFullscreen' in element && element.webkitRequestFullscreen) ||
    ('msRequestFullscreen' in element && element.msRequestFullscreen) ||
    ('webkitEnterFullscreen' in video && video.webkitEnterFullscreen)
  );
}

const video = document.createElement('video');

if (
  // Check non-standard Safari PiP support
  ('webkitSupportsPresentationMode' in video &&
    typeof video.webkitSupportsPresentationMode === 'function' &&
    video.webkitSupportsPresentationMode('picture-in-picture') &&
    'webkitSetPresentationMode' in video &&
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
