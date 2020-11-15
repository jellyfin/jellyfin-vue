import { hasVp8Support } from './mp4VideoFormats';
import { getSupportedAudioCodecs } from './audioFormats';
import { browserDetector } from '~/plugins/browserDetection';

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
function hasAc3Support(videoTestElement: HTMLVideoElement): boolean {
  if (browserDetector.isTv()) {
    return true;
  }

  return !!videoTestElement
    .canPlayType('audio/mp4; codecs="ac-3"')
    .replace(/no/, '');
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasEac3Support(videoTestElement: HTMLVideoElement): boolean {
  if (browserDetector.isTv()) {
    return true;
  }

  return !!videoTestElement
    .canPlayType('audio/mp4; codecs="ec-3"')
    .replace(/no/, '');
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasAacSupport(videoTestElement: HTMLVideoElement): boolean {
  return !!videoTestElement
    .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"')
    .replace(/no/, '');
}

/**
 *
 *
 * @returns
 */
function hasMp2AudioSupport() {
  return browserDetector.isTv();
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
function hasDtsSupport(videoTestElement: HTMLVideoElement) {
  // DTS audio not supported in 2018 models (Tizen 4.0)
  if (
    browserDetector.isTizen4() ||
    browserDetector.isTizen5() ||
    browserDetector.isTizen55()
  ) {
    return false;
  }

  return (
    browserDetector.isTv() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="dts-"')
      .replace(/no/, '') ||
    videoTestElement.canPlayType('video/mp4; codecs="dts+"').replace(/no/, '')
  );
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function getSupportedMP4AudioCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasAc3Support(videoTestElement)) {
    codecs.push('ac3');
  }

  if (hasEac3Support(videoTestElement)) {
    codecs.push('eac3');
  }

  if (hasAacSupport(videoTestElement)) {
    codecs.push('aac');
  }

  if (hasMp2AudioSupport()) {
    codecs.push('mp2');
  }

  if (hasDtsSupport(videoTestElement)) {
    codecs.push('dca');
    codecs.push('dts');
  }

  if (browserDetector.isTv()) {
    codecs.push('pcm_s16le');
    codecs.push('pcm_s24le');
  }

  if (browserDetector.isTizen()) {
    codecs.push('aac_latm');
  }

  if (getSupportedAudioCodecs('opus')) {
    codecs.push('opus');
  }

  if (getSupportedAudioCodecs('flac')) {
    codecs.push('flac');
  }

  if (hasVp8Support(videoTestElement)) {
    codecs.push('vorbis');
  }

  return codecs;
}
