import { Context, Plugin } from '@nuxt/types';

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
export class BrowserDetector {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  supportsMediaSource(): boolean {
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
   * @returns {boolean} Determines if user agent of navigator contains a key
   * @memberof BrowserDetector
   */
  private userAgentContains(key: string): boolean {
    let userAgent = '';

    if (process.client) {
      userAgent = navigator.userAgent || '';
    } else {
      userAgent = this.context.req.headers['user-agent'] || '';
    }

    return userAgent.includes(key);
  }

  /* Desktop Browsers */

  /**
   * Check if the current platform is Mozilla Firefox.
   *
   * @returns {boolean} Determines if browser is Mozilla Firefox
   * @memberof BrowserDetector
   */
  isFirefox(): boolean {
    return this.userAgentContains('Firefox/');
  }

  /**
   * Check if the current platform is Microsoft Edge.
   *
   * @static
   * @returns {boolean} Determines if browser is Microsoft Edge
   * @memberof BrowserDetector
   */
  isEdge(): boolean {
    return this.userAgentContains('Edg/') || this.userAgentContains('Edge/');
  }

  /**
   * Check if the current platform is Chromium based.
   *
   * @returns {boolean} Determines if browser is Chromium based
   * @memberof BrowserDetector
   */
  isChromiumBased(): boolean {
    return this.userAgentContains('Chrome');
  }

  /**
   * Check if the current platform is Google Chrome.
   *
   * @returns {boolean} Determines if browser is Google Chrome
   * @memberof BrowserDetector
   */
  isChrome(): boolean {
    // The Edge user agent will also contain the "Chrome" keyword, so we need
    // to make sure this is not Edge. Same happens for webos.
    return (
      this.userAgentContains('Chrome') && !this.isEdge() && !this.isWebOS()
    );
  }

  /**
   * Check if the current platform is from Apple.
   *
   * Returns true on all iOS browsers and on desktop Safari.
   *
   * Returns false for non-Safari browsers on macOS, which are independent of
   * Apple.
   *
   * @returns {boolean} Determines if current platform is from Apple
   * @memberof BrowserDetector
   */
  isApple(): boolean {
    if (process.client) {
      return navigator?.vendor.includes('Apple') && !this.isTizen();
    } else {
      return false;
    }
  }

  /**
   * Returns a major version number for Safari, or Safari-based iOS browsers.
   *
   * @returns {number | null} The major version number for Safari
   * @memberof BrowserDetector
   */
  safariVersion(): number | null {
    // All iOS browsers and desktop Safari will return true for isApple().
    if (!this.isApple()) {
      return null;
    }

    let userAgent = '';

    if (process.client && navigator.userAgent) {
      userAgent = navigator.userAgent;
    } else if (this.context.req.headers['user-agent']) {
      userAgent = this.context.req.headers['user-agent'];
    }

    // This works for iOS Safari and desktop Safari, which contain something
    // like "Version/13.0" indicating the major Safari or iOS version.
    let match = userAgent.match(/Version\/(\d+)/);

    if (match) {
      return parseInt(match[1], /* base= */ 10);
    }

    // This works for all other browsers on iOS, which contain something like
    // "OS 13_3" indicating the major & minor iOS version.
    match = userAgent.match(/OS (\d+)(?:_\d+)?/);

    if (match) {
      return parseInt(match[1], /* base= */ 10);
    }

    return null;
  }

  /* TV Platforms */

  /**
   * Check if the current platform is Tizen.
   *
   * @returns {boolean} Determines if current platform is Tizen
   * @memberof BrowserDetector
   */
  isTizen(): boolean {
    return this.userAgentContains('Tizen');
  }

  /**
   * Check if the current platform is Tizen 2
   *
   * @returns {boolean} Determines if current platform is Tizen 2
   * @memberof BrowserDetector
   */
  isTizen2(): boolean {
    return this.userAgentContains('Tizen 2');
  }

  /**
   * Check if the current platform is Tizen 3
   *
   * @returns {boolean} Determines if current platform is Tizen 3
   * @memberof BrowserDetector
   */
  isTizen3(): boolean {
    return this.userAgentContains('Tizen 3');
  }

  /**
   * Check if the current platform is Tizen 4.
   *
   * @returns {boolean} Determines if current platform is Tizen 4
   * @memberof BrowserDetector
   */
  isTizen4(): boolean {
    return this.userAgentContains('Tizen 4');
  }

  /**
   * Check if the current platform is Tizen 5.
   *
   * @returns {boolean} Determines if current platform is Tizen 5
   * @memberof BrowserDetector
   */
  isTizen5(): boolean {
    return this.userAgentContains('Tizen 5');
  }

  /**
   * Check if the current platform is Tizen 5.5.
   *
   * @returns {boolean} Determines if current platform is Tizen 5.5
   * @memberof BrowserDetector
   */
  isTizen55(): boolean {
    return this.userAgentContains('Tizen 5.5');
  }

  /**
   * Check if the current platform is WebOS.
   *
   * @returns {boolean} Determines if current platform is WebOS
   * @memberof BrowserDetector
   */
  isWebOS(): boolean {
    return this.userAgentContains('Web0S');
  }

  /**
   * @returns {boolean} Determines if current platform is WebOS1
   */
  isWebOS1(): boolean {
    return (
      this.isWebOS() &&
      this.userAgentContains('AppleWebKit/537') &&
      !this.userAgentContains('Chrome/')
    );
  }

  /**
   * @returns {boolean} Determines if current platform is WebOS1
   */
  isWebOS2(): boolean {
    return (
      this.isWebOS() &&
      this.userAgentContains('AppleWebKit/538') &&
      !this.userAgentContains('Chrome/')
    );
  }

  /**
   * @returns {boolean} Determines if current platform is WebOS3
   */
  isWebOS3(): boolean {
    return this.isWebOS() && this.userAgentContains('Chrome/38');
  }

  /**
   * @returns {boolean} Determines if current platform is WebOS4
   */
  isWebOS4(): boolean {
    return this.isWebOS() && this.userAgentContains('Chrome/53');
  }

  /**
   * @returns {boolean} Determines if current platform is WebOS5
   */
  isWebOS5(): boolean {
    return this.isWebOS() && this.userAgentContains('Chrome/68');
  }

  /* Platform Utilities */

  /**
   * @returns {boolean} Determines if current platform is Android
   */
  isAndroid(): boolean {
    return this.userAgentContains('Android');
  }

  /**
   * Guesses if the platform is a mobile one (iOS or Android).
   *
   * @returns {boolean} Determines if current platform is mobile (Guess)
   * @memberof BrowserDetector
   */
  isMobile(): boolean {
    let userAgent = '';

    if (process.client && navigator.userAgent) {
      userAgent = navigator.userAgent;
    } else if (this.context.req.headers['user-agent']) {
      userAgent = this.context.req.headers['user-agent'];
    }

    if (/(?:iPhone|iPad|iPod|Android)/.test(userAgent)) {
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
    if (process.client) {
      return this.isApple() && navigator.maxTouchPoints > 1;
    } else {
      return false;
    }
  }

  /**
   * Guesses if the platform is a Smart TV (Tizen or WebOS).
   *
   * @returns {boolean} Determines if platform is a Smart TV
   * @memberof BrowserDetector
   */
  isTv(): boolean {
    return this.isTizen() || this.isWebOS();
  }

  /**
   * Guesses if the platform is a PS4
   *
   * @returns {boolean} Determines if the device is a PS4
   * @memberof BrowserDetector
   */
  isPs4(): boolean {
    return this.userAgentContains('playstation 4');
  }

  /**
   * Guesses if the platform is a Xbox
   *
   * @returns {boolean} Determines if the device is a Xbox
   * @memberof BrowserDetector
   */
  isXbox(): boolean {
    return this.userAgentContains('xbox');
  }
}

const browserDetectionPlugin: Plugin = (context, inject) => {
  inject('browser', new BrowserDetector(context));
};

export default browserDetectionPlugin;
