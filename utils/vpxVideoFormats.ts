import { hasVp8Support, hasVp9Support, hasAv1Support } from './mp4VideoFormats';

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns {string[]}
 */
export function getSupportedVPXVideoCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];
  if (hasVp8Support(videoTestElement)) {
    codecs.push('vp8');
  }

  if (hasVp9Support(videoTestElement)) {
    codecs.push('vp9');
  }

  if (hasAv1Support(videoTestElement)) {
    codecs.push('av1');
  }

  return codecs;
}
