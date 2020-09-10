import { browserDetector } from '~/plugins/browserDetection';

/**
 *
 */
export function canPlayNativeHls(): boolean {
  if (browserDetector.isTizen()) {
    return true;
  }

  const media = document.createElement('video');
  if (
    media.canPlayType('application/x-mpegURL').replace(/no/, '') ||
    media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')
  ) {
    return true;
  }

  return false;
}

/**
 * @param videoTestElement
 */
export function hasMkvSupport(videoTestElement: HTMLVideoElement) {
  if (browserDetector.isTv()) {
    return true;
  }

  if (
    videoTestElement.canPlayType('video/x-matroska').replace(/no/, '') ||
    videoTestElement.canPlayType('video/mkv').replace(/no/, '')
  ) {
    return true;
  }

  if (browserDetector.isEdge()) {
    return true;
  }

  return false;
}
