import { BrowserDetector } from '@/utils/browser-detection';
import { Context } from '@nuxt/types';

const $browser = new BrowserDetector();
/**
 * Determines if audio codec is supported
 */
export function getSupportedAudioCodecs(format: string): boolean {
  let typeString;

  if (format === 'flac' && $browser.isTv()) {
    return true;
  } else if (format === 'wma' && $browser.isTizen()) {
    return true;
  } else if (format === 'asf' && $browser.isTv()) {
    return true;
  } else if (format === 'opus') {
    if (!$browser.isWebOS()) {
      typeString = 'audio/ogg; codecs="opus"';

      return !!document
        .createElement('audio')
        .canPlayType(typeString)
        .replace(/no/, '');
    }

    return false;
  } else if (format === 'alac' && $browser.isApple()) {
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
