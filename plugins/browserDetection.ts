import { Plugin } from '@nuxt/types';

declare module '@nuxt/types' {
  interface Context {
    $browser: BrowserDetector;
  }

  interface NuxtAppOptions {
    $browser: BrowserDetector;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $browser: BrowserDetector;
  }
}

/**
 * Utilities to detect the browser and get information on the current environment
 * Based on https://github.com/google/shaka-player/blob/master/lib/util/platform.js
 *
 * @class BrowserDetector
 */
class BrowserDetector {
  supportsMediaSource() {
    // Browsers that lack a media source implementation will have no reference
    // to |window.MediaSource|.
    if (!window.MediaSource) {
      return false;
    }

    return true;
  }

  /**
   * Check if the user agent of the navigator contains a key.
   *
   * @private
   * @static
   * @param {string} key - Key for which to perform a check.
   * @returns {boolean}
   * @memberof BrowserDetector
   */
  private userAgentContains(key: string) {
    const userAgent = navigator.userAgent || '';
    return userAgent.includes(key);
  }

  /* Desktop Browsers */

  /**
   * Check if the current platform is Mozilla Firefox.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isFirefox() {
    return this.userAgentContains('Firefox/');
  }

  /**
   * Check if the current platform is Microsoft Edge.
   *
   * @static
   * @returns {boolean}
   * @memberof BrowserDetector
   */
  isEdge() {
    return this.userAgentContains('Edge/');
  }

  /**
   * Check if the current platform is Google Chrome.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isChrome() {
    // The Edge user agent will also contain the "Chrome" keyword, so we need
    // to make sure this is not Edge.
    return this.userAgentContains('Chrome') && !this.isEdge();
  }

  /**
   * Check if the current platform is from Apple.
   *
   * Returns true on all iOS browsers and on desktop Safari.
   *
   * Returns false for non-Safari browsers on macOS, which are independent of
   * Apple.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isApple() {
    return (
      navigator.vendor && navigator.vendor.includes('Apple') && !this.isTizen()
    );
  }

  /**
   * Returns a major version number for Safari, or Safari-based iOS browsers.
   *
   * @returns
   * @memberof BrowserDetector
   */
  safariVersion() {
    // All iOS browsers and desktop Safari will return true for isApple().
    if (!this.isApple()) {
      return null;
    }

    // This works for iOS Safari and desktop Safari, which contain something
    // like "Version/13.0" indicating the major Safari or iOS version.
    let match = navigator.userAgent.match(/Version\/(\d+)/);
    if (match) {
      return parseInt(match[1], /* base= */ 10);
    }

    // This works for all other browsers on iOS, which contain something like
    // "OS 13_3" indicating the major & minor iOS version.
    match = navigator.userAgent.match(/OS (\d+)(?:_\d+)?/);
    if (match) {
      return parseInt(match[1], /* base= */ 10);
    }

    return null;
  }

  /* TV Platforms */

  /**
   * Check if the current platform is Tizen.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen() {
    return this.userAgentContains('Tizen');
  }

  /**
   * Check if the current platform is Tizen 2
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen2() {
    return this.userAgentContains('Tizen 2');
  }

  /**
   * Check if the current platform is Tizen 3
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen3() {
    return this.userAgentContains('Tizen 3');
  }

  /**
   * Check if the current platform is Tizen 4.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen4() {
    return this.userAgentContains('Tizen 4');
  }

  /**
   * Check if the current platform is Tizen 5.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen5() {
    return this.userAgentContains('Tizen 5');
  }

  /**
   * Check if the current platform is Tizen 5.5.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTizen55() {
    return this.userAgentContains('Tizen 5.5');
  }

  /**
   * Check if the current platform is WebOS.
   *
   * @returns
   * @memberof BrowserDetector
   */
  isWebOS() {
    return this.userAgentContains('Web0S');
  }

  isWebOS1() {
    return (
      this.isWebOS &&
      this.userAgentContains('AppleWebKit/537') &&
      !this.userAgentContains('Chrome/')
    );
  }

  isWebOS2() {
    return (
      this.isWebOS &&
      this.userAgentContains('AppleWebKit/538') &&
      !this.userAgentContains('Chrome/')
    );
  }

  isWebOS3() {
    return this.isWebOS && this.userAgentContains('Chrome/38');
  }

  isWebOS4() {
    return this.isWebOS && this.userAgentContains('Chrome/53');
  }

  isWebOS5() {
    return this.isWebOS && this.userAgentContains('Chrome/68');
  }

  /* Platform Utilities */

  isAndroid() {
    return this.userAgentContains('Android');
  }

  /**
   * Guesses if the platform is a mobile one (iOS or Android).
   *
   * @returns
   * @memberof BrowserDetector
   */
  isMobile() {
    if (/(?:iPhone|iPad|iPod|Android)/.test(navigator.userAgent)) {
      // This is Android, iOS, or iPad < 13.
      return true;
    }

    // Starting with iOS 13 on iPad, the user agent string no longer has the
    // word "iPad" in it.  It looks very similar to desktop Safari.  This seems
    // to be intentional on Apple's part.
    // See: https://forums.developer.apple.com/thread/119186
    //
    // So if it's an Apple device with multi-touch support, assume it's a mobile
    // device.  If some future iOS version starts masking their user agent on
    // both iPhone & iPad, this clause should still work.  If a future
    // multi-touch desktop Mac is released, this will need some adjustment.
    //
    // As of January 2020, this is mainly used to adjust the default UI config
    // for mobile devices, so it's low risk if something changes to break this
    // detection.
    return this.isApple() && navigator.maxTouchPoints > 1;
  }

  /**
   * Guesses if the platform is a Smart TV (Tizen or WebOS).
   *
   * @returns
   * @memberof BrowserDetector
   */
  isTv() {
    return this.isTizen() || this.isWebOS();
  }
}

export const browserDetector = new BrowserDetector();

const browserDetectorPlugin: Plugin = (_context, inject) => {
  inject('browser', browserDetector);
};

export default browserDetectorPlugin;
