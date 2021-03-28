import { Context } from '@nuxt/types';

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has H264 support
 */
export function hasH264Support(videoTestElement: HTMLVideoElement): boolean {
  return !!(
    videoTestElement.canPlayType &&
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
      .replace(/no/, '')
  );
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has H265 support
 */
export function hasH265Support(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTv()) {
    return true;
  }

  return !!(
    videoTestElement.canPlayType &&
    (videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.1.L120"')
      .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hev1.1.L120"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hvc1.1.0.L120"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hev1.1.0.L120"')
        .replace(/no/, ''))
  );
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has HEVC Support
 */
export function hasHevcSupport(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTv()) {
    return true;
  }

  return !!(
    !!videoTestElement.canPlayType &&
    (videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.1.L120"')
      .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hev1.1.L120"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hvc1.1.0.L120"')
        .replace(/no/, '') ||
      videoTestElement
        .canPlayType('video/mp4; codecs="hev1.1.0.L120"')
        .replace(/no/, ''))
  );
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has AV1 support
 */
export function hasAv1Support(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  if (context.$browser.isTizen() && context.$browser.isTizen55()) {
    return true;
  } else if (context.$browser.isWebOS5() && window.outerHeight >= 2160) {
    return true;
  }

  return !!(
    videoTestElement.canPlayType &&
    videoTestElement
      .canPlayType('video/webm; codecs="av01.0.15M.10"')
      .replace(/no/, '')
  );
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has VC1 support
 */
function hasVc1Support(
  context: Context,
  videoTestElement: HTMLVideoElement
): boolean {
  return !!(
    context.$browser.isTv() ||
    videoTestElement.canPlayType('video/mp4; codecs="vc-1"').replace(/no/, '')
  );
}

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has VP8 support
 */
export function hasVp8Support(videoTestElement: HTMLVideoElement): boolean {
  return !!(
    videoTestElement.canPlayType &&
    videoTestElement.canPlayType('video/webm; codecs="vp8"').replace(/no/, '')
  );
}

/**
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {boolean} Determines if browser has VP9 support
 */
export function hasVp9Support(videoTestElement: HTMLVideoElement): boolean {
  return !!(
    videoTestElement.canPlayType &&
    videoTestElement.canPlayType('video/webm; codecs="vp9"').replace(/no/, '')
  );
}

/**
 * Queries the platform for the codecs suppers in an MP4 container.
 *
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {string[]} Array of codec identifiers.
 */
export function getSupportedMP4VideoCodecs(
  context: Context,
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasH264Support(videoTestElement)) {
    codecs.push('h264');
  }

  if (hasHevcSupport(context, videoTestElement)) {
    // Safari is lying on HDR and 60fps videos, use fMP4 instead
    if (!context.$browser.isApple()) {
      codecs.push('hevc');
    }
  }

  if (context.$browser.isTv()) {
    codecs.push('mpeg2video');
  }

  if (hasVc1Support(context, videoTestElement)) {
    codecs.push('vc1');
  }

  if (context.$browser.isTizen()) {
    codecs.push('msmpeg4v2');
  }

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
