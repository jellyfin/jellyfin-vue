import {
  hasAv1Support,
  hasVp8Support,
  hasVp9Support
} from './mp4-video-formats';

/**
 * @param context - Nuxt context
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns An array of supported codecs
 */
export function getSupportedWebMVideoCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasVp8Support(videoTestElement)) {
    codecs.push('vp8');
  }

  if (hasVp9Support(videoTestElement)) {
    codecs.push('vp9');
  }

  if (hasAv1Support(context, videoTestElement)) {
    codecs.push('av1');
  }

  return codecs;
}
