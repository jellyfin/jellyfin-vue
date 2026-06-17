/**
 * @deprecated - Check #/utils/playback-profiles/index
 */

import { isApple, isTizen, isTv, isWebOS } from '#/utils/browser-detection.ts';

/**
 * Determines if audio codec is supported
 */
export function getSupportedAudioCodecs(format: string): boolean {
  if (format === 'flac' && isTv()) {
    return true;
  }

  if (format === 'wma' && isTizen()) {
    return true;
  }

  if (format === 'asf' && isTv()) {
    return true;
  }

  let typeString;

  if (format === 'opus') {
    if (!isWebOS()) {
      typeString = 'audio/ogg; codecs="opus"';

      return !!document
        .createElement('audio')
        .canPlayType(typeString)
        .replace(/no/, '');
    }

    return false;
  }

  if (format === 'alac' && isApple()) {
    return true;
  }

  if (format === 'webma') {
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
