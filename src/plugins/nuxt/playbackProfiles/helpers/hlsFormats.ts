import { Context } from '@nuxt/types';
import { hasH264Support, hasH265Support } from './mp4VideoFormats';
import { hasEac3Support, hasAacSupport } from './mp4AudioFormats';
import { getSupportedAudioCodecs } from './audioFormats';

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser has AC3 in HLS support
 */
function supportsAc3InHls(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean | string {
  if (context.$browser.isTv()) {
    return true;
  }

  if (videoTestElement.canPlayType) {
    return (
      videoTestElement
        .canPlayType('application/x-mpegurl; codecs="avc1.42E01E, ac-3"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType(
          'application/vnd.apple.mpegURL; codecs="avc1.42E01E, ac-3"'
        )
        .replace(/no/, '')
    );
  }

  return false;
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} Array of video codecs supported in HLS
 */
export function getHlsVideoCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const hlsVideoCodecs = [];

  if (hasH264Support(videoTestElement)) {
    hlsVideoCodecs.push('h264');
  }

  if (hasH265Support(context, videoTestElement) || context.$browser.isTv()) {
    hlsVideoCodecs.push('h265');
    hlsVideoCodecs.push('hevc');
  }

  return hlsVideoCodecs;
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} Array of audio codecs supported in HLS
 */
export function getHlsAudioCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const hlsVideoAudioCodecs = [];

  if (supportsAc3InHls(context, videoTestElement)) {
    hlsVideoAudioCodecs.push('ac3');

    if (hasEac3Support(context, videoTestElement)) {
      hlsVideoAudioCodecs.push('eac3');
    }
  }

  if (hasAacSupport(videoTestElement)) {
    hlsVideoAudioCodecs.push('aac');
  }

  if (getSupportedAudioCodecs(context, 'opus')) {
    hlsVideoAudioCodecs.push('opus');
  }

  return hlsVideoAudioCodecs;
}
