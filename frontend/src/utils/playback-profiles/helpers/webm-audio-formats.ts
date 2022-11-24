/**
 * @param context - Nuxt context
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns An array of supported codecs
 */
export function getSupportedWebMAudioCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  codecs.push('vorbis');

  if (
    !context.$browser.isWebOS() &&
    videoTestElement.canPlayType('audio/ogg; codecs="opus"').replace(/no/, '')
  ) {
    codecs.push('opus');
  }

  return codecs;
}
