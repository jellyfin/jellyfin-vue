import { hasH264Support, hasHevcSupport } from './mp4VideoFormats';
import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {HTMLVideoElement} videoTestElement A HTML video element for testing codecs
 * @returns {string[]} List of supported fmp4 video codecs
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
