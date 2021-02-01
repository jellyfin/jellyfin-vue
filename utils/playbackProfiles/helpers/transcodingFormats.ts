import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser can play native Hls
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
 * @returns {boolean} Determines if the browser can play Hls with Media Source Extensions
 */
export function canPlayHlsWithMSE(): boolean {
  return browserDetector.supportsMediaSource();
}

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser can play Mkvs
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
