import { browserDetector } from '~/plugins/browserDetection';

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns {boolean}
 */
export function canPlayNativeHls(videoTestElement: HTMLVideoElement): boolean {
  if (browserDetector.isTizen()) {
    return true;
  }

  if (
    videoTestElement.canPlayType('application/x-mpegURL').replace(/no/, '') ||
    videoTestElement
      .canPlayType('application/vnd.apple.mpegURL')
      .replace(/no/, '')
  ) {
    return true;
  }

  return false;
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasMkvSupport(videoTestElement: HTMLVideoElement): boolean {
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
