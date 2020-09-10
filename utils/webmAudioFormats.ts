import { browserDetector } from '~/plugins/browserDetection';

/**
 * @param videoTestElement
 */
export function getSupportedWebMAudioCodecs() {
  const codecs = [];

  codecs.push('vorbis');

  if (
    !browserDetector.isWebOS() &&
    document
      .createElement('audio')
      .canPlayType('audio/ogg; codecs="opus"')
      .replace(/no/, '')
  ) {
    codecs.push('opus');
  }

  return codecs;
}
