import { getSupportedAudioCodecs } from './audioFormats';
import {
  hasAacSupport,
  hasAc3InHlsSupport,
  hasAc3Support,
  hasEac3Support,
  hasMp3AudioSupport
} from './mp4AudioFormats';

/**
 * @param {HTMLVideoElement} videoTestElement s
 * @returns {string[]} List of ...
 */
export function getSupportedTsAudioCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasAacSupport(videoTestElement)) {
    codecs.push('aac');
  }

  if (hasMp3AudioSupport(videoTestElement)) {
    codecs.push('mp3');
  }

  if (hasAc3Support(videoTestElement)) {
    if (hasAc3InHlsSupport(videoTestElement)) {
      codecs.push('ac3');

      if (hasEac3Support(videoTestElement)) {
        codecs.push('eac3');
      }
    }
  }

  if (getSupportedAudioCodecs('opus')) {
    codecs.push('opus');
  }

  return codecs;
}
