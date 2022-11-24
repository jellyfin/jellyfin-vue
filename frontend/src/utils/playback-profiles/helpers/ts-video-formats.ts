import { hasH264Support } from './mp4-video-formats';

/**
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns List of supported ts video codecs
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
