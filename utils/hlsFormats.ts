import { hasH264Support, hasH265Support } from './mp4VideoFormats';
import { hasEac3Support, hasAacSupport } from './mp4AudioFormats';
import { getSupportedAudioCodecs } from './audioFormats';
import { browserDetector } from '~/plugins/browserDetection';

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
function supportsAc3InHls(videoTestElement: HTMLVideoElement) {
  if (browserDetector.isTv()) {
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
 *
 *
 * @export
 * @param {HTMLVideoElement} videoTestElement
 * @returns {string[]}
 */
export function getHlsVideoCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const hlsVideoCodecs = [];

  if (hasH264Support(videoTestElement)) {
    hlsVideoCodecs.push('h264');
  }

  if (hasH265Support(videoTestElement) || browserDetector.isTv()) {
    hlsVideoCodecs.push('h265');
    hlsVideoCodecs.push('hevc');
  }

  return hlsVideoCodecs;
}

/**
 *
 *
 * @export
 * @param {HTMLVideoElement} videoTestElement
 * @returns {string[]}
 */
export function getHlsAudioCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const hlsVideoAudioCodecs = [];

  if (supportsAc3InHls(videoTestElement)) {
    hlsVideoAudioCodecs.push('ac3');

    if (hasEac3Support(videoTestElement)) {
      hlsVideoAudioCodecs.push('eac3');
    }
  }

  if (hasAacSupport(videoTestElement)) {
    hlsVideoAudioCodecs.push('aac');
  }

  if (getSupportedAudioCodecs('opus')) {
    hlsVideoAudioCodecs.push('opus');
  }

  return hlsVideoAudioCodecs;
}
