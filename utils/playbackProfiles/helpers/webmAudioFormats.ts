import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param {HTMLVideoElement} videoTestElement A HTML video element for testing codecs
 * @returns {string[]} An array of supported codecs
 */
export function getSupportedWebMAudioCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  codecs.push('vorbis');

  if (
    !browserDetector.isWebOS() &&
    videoTestElement.canPlayType('audio/ogg; codecs="opus"').replace(/no/, '')
  ) {
    codecs.push('opus');
  }

  return codecs;
}
