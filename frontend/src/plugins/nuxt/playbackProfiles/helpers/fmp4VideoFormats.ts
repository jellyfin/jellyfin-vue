import { Context } from '@nuxt/types';
import { hasH264Support, hasHevcSupport } from './mp4VideoFormats';

/**
 * @param context - Nuxt context
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns List of supported fmp4 video codecs
 */
export function getSupportedFmp4VideoCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (
    (context.$browser.isApple() ||
      context.$browser.isEdge() ||
      context.$browser.isTizen() ||
      context.$browser.isWebOS()) &&
    hasHevcSupport(context, videoTestElement)
  ) {
    codecs.push('hevc');
  }

  if (
    hasH264Support(videoTestElement) &&
    (context.$browser.isChrome() ||
      context.$browser.isFirefox() ||
      context.$browser.isApple() ||
      context.$browser.isEdge() ||
      context.$browser.isTizen() ||
      context.$browser.isWebOS())
  ) {
    codecs.push('h264');
  }

  return codecs;
}
