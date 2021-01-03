import { hasH264Support } from './mp4VideoFormats';

/**
 * @param {HTMLVideoElement} videoTestElement s
 * @returns {string[]} List of ...
 */
export function getSupportedTsVideoCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasH264Support(videoTestElement)) {
    codecs.push('h264');
  }

  return codecs;
}
