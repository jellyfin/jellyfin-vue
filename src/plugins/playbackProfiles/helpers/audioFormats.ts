import { Context } from '@nuxt/types';

/**
 * @param {Context} context - Nuxt context
 * @param {string} format - Audio codec to test
 * @returns {boolean} Determines if audio codec is supported
 */
export function getSupportedAudioCodecs(
  context: Context,
  format: string
): boolean {
  let typeString;

  if (format === 'flac' && context.$browser.isTv()) {
    return true;
  } else if (format === 'wma' && context.$browser.isTizen()) {
    return true;
  } else if (format === 'asf' && context.$browser.isTv()) {
    return true;
  } else if (format === 'opus') {
    if (!context.$browser.isWebOS()) {
      typeString = 'audio/ogg; codecs="opus"';

      return !!document
        .createElement('audio')
        .canPlayType(typeString)
        .replace(/no/, '');
    }

    return false;
  } else if (format === 'alac' && context.$browser.isApple()) {
    return true;
  } else if (format === 'webma') {
    typeString = 'audio/webm';
  } else if (format === 'mp2') {
    typeString = 'audio/mpeg';
  } else {
    typeString = 'audio/' + format;
  }

  return !!document
    .createElement('audio')
    .canPlayType(typeString)
    .replace(/no/, '');
}
