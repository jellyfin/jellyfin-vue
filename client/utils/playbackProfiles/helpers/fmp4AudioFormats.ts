import { getSupportedAudioCodecs } from './audioFormats';
import {
  hasAacSupport,
  hasAc3InHlsSupport,
  hasAc3Support,
  hasEac3Support,
  hasMp3AudioSupport
} from './mp4AudioFormats';
import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} List of supported FMP4 audio codecs
 */
export function getSupportedFmp4AudioCodecs(
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

  if (getSupportedAudioCodecs('flac')) {
    if (!browserDetector.isEdge()) {
      codecs.push('flac');
    }
  }

  if (getSupportedAudioCodecs('alac')) {
    codecs.push('alac');
  }

  return codecs;
}
