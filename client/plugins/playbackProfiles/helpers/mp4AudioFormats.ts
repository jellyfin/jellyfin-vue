import { Context } from '@nuxt/types';
import { hasVp8Support } from './mp4VideoFormats';
import { getSupportedAudioCodecs } from './audioFormats';

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser has AC3 support
 */
export function hasAc3Support(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTv()) {
    return true;
  }

  return !!videoTestElement
    .canPlayType('audio/mp4; codecs="ac-3"')
    .replace(/no/, '');
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if the browser has AC3 support
 */
export function hasAc3InHlsSupport(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTizen() || context.$browser.isWebOS()) {
    return true;
  }

  if (videoTestElement.canPlayType) {
    return !!(
      videoTestElement
        .canPlayType('application/x-mpegurl; codecs="avc1.42E01E, ac-3"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType(
          'application/vnd.apple.mpegURL; codecs="avc1.42E01E, ac-3"'
        )
        .replace(/no/, '')
    );
  }

  return false;
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has EAC3 support
 */
export function hasEac3Support(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTv()) {
    return true;
  }

  return !!videoTestElement
    .canPlayType('audio/mp4; codecs="ec-3"')
    .replace(/no/, '');
}

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has AAC support
 */
export function hasAacSupport(videoTestElement: HTMLVideoElement): boolean {
  return !!videoTestElement
    .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"')
    .replace(/no/, '');
}

/**
 * @param {Context} context - Nuxt context
 * @returns {boolean} Determines if browser has MP2 support
 */
export function hasMp2AudioSupport(context: Context): boolean {
  return context.$browser.isTv();
}

/**
 *
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has Mp3 support
 */
export function hasMp3AudioSupport(
  videoTestElement: HTMLVideoElement
): boolean {
  return !!(
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp4a.69"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp4a.6B"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp3"')
      .replace(/no/, '')
  );
}

/**
 * Determines DTS audio support
 *
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browserr has DTS audio support
 */
export function hasDtsSupport(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean | string {
  // DTS audio not supported in 2018 models (Tizen 4.0)
  if (
    context.$browser.isTizen4() ||
    context.$browser.isTizen5() ||
    context.$browser.isTizen55()
  ) {
    return false;
  }

  return (
    context.$browser.isTv() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="dts-"')
      .replace(/no/, '') ||
    videoTestElement.canPlayType('video/mp4; codecs="dts+"').replace(/no/, '')
  );
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} Array of supported MP4 audio codecs
 */
export function getSupportedMP4AudioCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasAacSupport(videoTestElement)) {
    codecs.push('aac');
  }

  if (hasMp3AudioSupport(videoTestElement)) {
    codecs.push('mp3');
  }

  if (hasAc3Support(context, videoTestElement)) {
    codecs.push('ac3');

    if (hasEac3Support(context, videoTestElement)) {
      codecs.push('eac3');
    }
  }

  if (hasMp2AudioSupport(context)) {
    codecs.push('mp2');
  }

  if (hasDtsSupport(context, videoTestElement)) {
    codecs.push('dca');
    codecs.push('dts');
  }

  if (context.$browser.isTizen() || context.$browser.isWebOS()) {
    codecs.push('pcm_s16le');
    codecs.push('pcm_s24le');
  }

  if (context.$browser.isTizen()) {
    codecs.push('aac_latm');
  }

  if (getSupportedAudioCodecs(context, 'opus')) {
    codecs.push('opus');
  }

  if (getSupportedAudioCodecs(context, 'flac')) {
    codecs.push('flac');
  }

  if (getSupportedAudioCodecs(context, 'alac')) {
    codecs.push('alac');
  }

  if (hasVp8Support || context.$browser.isTizen()) {
    codecs.push('vorbis');
  }

  return codecs;
}
