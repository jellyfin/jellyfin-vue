import { Context } from '@nuxt/types';
import { getSupportedAudioCodecs } from './audioFormats';
import {
  hasAacSupport,
  hasAc3InHlsSupport,
  hasAc3Support,
  hasEac3Support,
  hasMp3AudioSupport
} from './mp4AudioFormats';

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} List of supported Ts audio codecs
 */
export function getSupportedTsAudioCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasAacSupport(videoTestElement)) {
    codecs.push('aac');
  }

  if (hasMp3AudioSupport(videoTestElement)) {
    codecs.push('mp3');
  }

  if (hasAc3Support(context, videoTestElement)) {
    if (hasAc3InHlsSupport(context, videoTestElement)) {
      codecs.push('ac3');

      if (hasEac3Support(context, videoTestElement)) {
        codecs.push('eac3');
      }
    }
  }

  if (getSupportedAudioCodecs(context, 'opus')) {
    codecs.push('opus');
  }

  return codecs;
}
