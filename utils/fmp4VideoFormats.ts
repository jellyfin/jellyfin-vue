import { hasH264Support, hasHevcSupport } from './mp4VideoFormats';
import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {HTMLVideoElement} videoTestElement s
 * @returns {string[]} List of ...
 */
export function getSupportedFmp4VideoCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (
    (browserDetector.isApple() ||
      browserDetector.isTizen() ||
      browserDetector.isWebOS()) &&
    hasHevcSupport(videoTestElement)
  ) {
    codecs.push('hevc');
  }

  if (hasH264Support(videoTestElement)) {
    if (
      browserDetector.isApple() ||
      browserDetector.isTizen() ||
      browserDetector.isWebOS()
    ) {
      codecs.push('h264');
    }
  }

  return codecs;
}
