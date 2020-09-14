import { browserDetector } from '~/plugins/browserDetection';

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
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
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasH265Support(videoTestElement: HTMLVideoElement): boolean {
  if (browserDetector.isTv()) {
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
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasAv1Support(videoTestElement: HTMLVideoElement): boolean {
  if (browserDetector.isTizen && browserDetector.isTizen55()) {
    return true;
  } else if (browserDetector.isWebOS5() && window.outerHeight >= 2160) {
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
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
function hasVc1Support(videoTestElement: HTMLVideoElement): boolean {
  return !!(
    browserDetector.isTv() ||
    videoTestElement.canPlayType('video/mp4; codecs="vc-1"').replace(/no/, '')
  );
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
 */
export function hasVp8Support(videoTestElement: HTMLVideoElement): boolean {
  return !!(
    videoTestElement.canPlayType &&
    videoTestElement.canPlayType('video/webm; codecs="vp8"').replace(/no/, '')
  );
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement
 * @returns
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
 * @param videoTestElement
 * @returns {string[]} Array of codec identifiers.
 */
export function getSupportedMP4VideoCodecs(
  videoTestElement: HTMLVideoElement
): string[] {
  const codecs = [];

  if (hasH264Support(videoTestElement)) {
    codecs.push('h264');
  }

  if (hasH265Support(videoTestElement)) {
    codecs.push('h265');
    codecs.push('hevc');
  }

  if (browserDetector.isTv()) {
    codecs.push('mpeg2video');
  }

  if (hasVc1Support(videoTestElement)) {
    codecs.push('vc1');
  }

  if (hasAv1Support(videoTestElement)) {
    codecs.push('av1');
  }

  if (hasVp8Support(videoTestElement)) {
    codecs.push('vp8');
  }

  if (hasVp9Support(videoTestElement)) {
    codecs.push('vp9');
  }

  return codecs;
}
