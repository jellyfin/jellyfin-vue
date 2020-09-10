import { hasVp8Support, hasVp9Support, hasAv1Support } from './mp4VideoFormats';

/**
 * @param videoTestElement
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
