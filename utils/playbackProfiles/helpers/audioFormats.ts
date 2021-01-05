import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {string} format - Audio codec to test
 * @returns {boolean} Determines if audio codec is supported
 */
export function getSupportedAudioCodecs(format: string): boolean {
  let typeString;

  if (format === 'flac') {
    if (browserDetector.isTv()) {
      return true;
    }
  } else if (format === 'wma') {
    if (browserDetector.isTizen()) {
      return true;
    }
  } else if (format === 'asf') {
    if (browserDetector.isTv()) {
      return true;
    }
  } else if (format === 'opus') {
    if (!browserDetector.isWebOS()) {
      typeString = 'audio/ogg; codecs="opus"';
      return !!document
        .createElement('audio')
        .canPlayType(typeString)
        .replace(/no/, '');
    }

    return false;
  } else if (format === 'alac') {
    if (browserDetector.isApple()) {
      return true;
    }
  } else if (format === 'mp2') {
    // TODO: Remnant from jf-web. Investigate where it is supported
    return false;
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
