import {
  useNavigatorLanguage,
  usePreferredDark,
  watchImmediate } from '@vueuse/core';
import { computed, watch, type CSSProperties } from 'vue';
import { i18n } from '@/plugins/i18n';
import { remote } from '@/plugins/remote';
import { vuetify } from '@/plugins/vuetify';
import { sealed } from '@/utils/validation';
import { SyncedStore } from '@/store/super/synced-store';
import { FALLBACK_SUBTITLE_FONT, SUBTITLE_FONT_FAMILIES } from '@/utils/subtitles';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export type subtitleFontFamily = typeof SUBTITLE_FONT_FAMILIES[number];
export interface ClientSettingsState {
  darkMode: 'auto' | boolean;
  locale: string;
  subtitleAppearance: {
    fontFamily: subtitleFontFamily;
    fontSize: number;
    positionFromBottom: number;
    backdrop: boolean;
    stroke: boolean;
  };
}

@sealed
class ClientSettingsStore extends SyncedStore<ClientSettingsState> {
  private readonly _browserPrefersDark = usePreferredDark();
  private readonly _navigatorLanguage = useNavigatorLanguage();
  private readonly _BROWSER_LANGUAGE = computed<string>(() => {
    const rawString = this._navigatorLanguage.language.value ?? '';
    /**
     * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
     */
    const cleanString = rawString.split('-');

    return cleanString[0];
  });

  public set locale(newVal: string) {
    this._state.locale
      = i18n.availableLocales.includes(newVal) && newVal !== 'auto'
        ? newVal
        : 'auto';
  }

  public get locale(): string {
    return this._state.locale;
  }

  public set darkMode(newVal: 'auto' | boolean) {
    this._state.darkMode = newVal;
  }

  public get darkMode(): 'auto' | boolean {
    return this._state.darkMode;
  }

  public set subtitleAppearance(newVal: ClientSettingsState['subtitleAppearance']) {
    this._state.subtitleAppearance = newVal;
  }

  public get subtitleAppearance(): ClientSettingsState['subtitleAppearance'] {
    return this._state.subtitleAppearance;
  }

  /**
   * CSS Style Properties for subtitles 
   */
  public get subtitleStyle(): CSSProperties {
    return {
      fontFamily: `${this.subtitleAppearance.fontFamily}, ${FALLBACK_SUBTITLE_FONT} !important`,
      fontSize: `${this.subtitleAppearance.fontSize}em`,
      marginBottom: `${this.subtitleAppearance.positionFromBottom}vh`,
      backgroundColor: this.subtitleAppearance.backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      padding: '10px',
      color: 'white',
      /**
       * If stroke is enabled we use the textShadow property
       * to create a stroke outline around the text
       */
      textShadow: this.subtitleAppearance.stroke
        ? `
        4px 0 0 black,
        3.6956px 1.5308px 0 black,
        2.8284px 2.8284px 0 black,
        1.5308px 3.6956px 0 black,
        0 4px 0 black,
        -1.5308px 3.6956px 0 black,
        -2.8284px 2.8284px 0 black,
        -3.6956px 1.5308px 0 black,
        -4px 0 0 black,
        -3.6956px -1.5308px 0 black,
        -2.8284px -2.8284px 0 black,
        -1.5308px -3.6956px 0 black,
        0 -4px 0 black,
        1.5308px -3.6956px 0 black,
        2.8284px -2.8284px 0 black,
        3.6956px -1.5308px 0 black,
        2px 2px 15px black !important`
        : undefined
      }
  }

  public readonly currentTheme = computed(() => {
    const dark = 'dark';
    const light = 'light';
    const browserColor = this._browserPrefersDark.value ? dark : light;
    const userColor
      = this.darkMode !== 'auto' && this.darkMode ? dark : light;

    return this.darkMode === 'auto' ? browserColor : userColor;
  });

  private readonly _updateLocale = (): void => {
    i18n.locale.value
      = this.locale === 'auto'
        ? this._BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value)
        : this.locale;
    vuetify.locale.current.value = i18n.locale.value;
  };

  public constructor() {
    super('clientSettings', {
      darkMode: 'auto',
      locale: 'auto',
      subtitleAppearance: {
        fontFamily: SUBTITLE_FONT_FAMILIES[0],
        fontSize: 1.5,
        positionFromBottom: 10,
        backdrop: true,
        stroke: false
      }
    }, 'localStorage');
    /**
     * == WATCHERS ==
     */

    /**
     * Locale change
     */
    watchImmediate(
      [this._BROWSER_LANGUAGE, (): typeof this.locale => this.locale],
      this._updateLocale
    );

    /**
     * Vuetify theme change
     */
    watchImmediate(this.currentTheme, () => {
      window.requestAnimationFrame(() => {
        vuetify.theme.global.name.value
          = this.currentTheme.value;
      });
    });

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._reset();
        }
      }, { flush: 'post' }
    );
  }
}

export const clientSettings = new ClientSettingsStore();
