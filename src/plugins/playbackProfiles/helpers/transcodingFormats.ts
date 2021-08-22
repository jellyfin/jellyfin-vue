import { Context } from '@nuxt/types';

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser can play native Hls
 */
export function canPlayNativeHls(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTizen()) {
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
 * @param {Context} context - Nuxt context
 * @returns {boolean} Determines if the browser can play Hls with Media Source Extensions
 */
export function canPlayHlsWithMSE(context: Context): boolean {
  return context.$browser.supportsMediaSource();
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser can play Mkvs
 */
export function hasMkvSupport(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTv()) {
    return true;
  }

  if (
    videoTestElement.canPlayType('video/x-matroska').replace(/no/, '') ||
    videoTestElement.canPlayType('video/mkv').replace(/no/, '')
  ) {
    return true;
  }

  if (context.$browser.isEdge()) {
    return true;
  }

  return false;
}
