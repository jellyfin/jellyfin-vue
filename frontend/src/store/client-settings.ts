import {
  useNavigatorLanguage,
  usePreferredDark,
  watchImmediate } from '@vueuse/core';
import { computed, watch } from 'vue';
import { i18n } from '@/plugins/i18n';
import { remote } from '@/plugins/remote';
import { vuetify } from '@/plugins/vuetify';
import { sealed } from '@/utils/validation';
import { SyncedStore } from '@/store/super/synced-store';
import { useFont } from '@/composables/use-font';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export interface ClientSettingsState {
  darkMode: 'auto' | boolean;
  locale: string;
  subtitleAppearance: {
    fontFamily: string;
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
  private readonly _bodyFont = useFont();
  private readonly _BROWSER_LANGUAGE = computed<string>(() => {
    const rawString = this._navigatorLanguage.language.value ?? '';
    /**
     * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
     */
    const cleanString = rawString.split('-');

    return cleanString[0];
  });

  private readonly _BODY_FONT = this._bodyFont.currentFont;

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

  private readonly _updateSubtitleFontFamily = (): void => {
    this.subtitleAppearance.fontFamily
      = this.subtitleAppearance.fontFamily === 'auto'
        ? this._BODY_FONT.value
        : this.subtitleAppearance.fontFamily;
  };

  public constructor() {
    super('clientSettings', {
      darkMode: 'auto',
      locale: 'auto',
      subtitleAppearance: {
        fontFamily: 'auto',
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
     * Font family changes
     */
    watchImmediate(this._BODY_FONT, this._updateSubtitleFontFamily);

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
