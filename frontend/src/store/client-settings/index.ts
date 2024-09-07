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
import type { TypographyChoices } from '@/store';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export interface ClientSettingsState {
  typography: TypographyChoices;
  darkMode: 'auto' | boolean;
  locale: string;
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

  public get typography() {
    return this._state.typography;
  }

  public set typography(newVal: ClientSettingsState['typography']) {
    this._state.typography = newVal;
  }

  public set darkMode(newVal: 'auto' | boolean) {
    this._state.darkMode = newVal;
  }

  public get darkMode(): 'auto' | boolean {
    return this._state.darkMode;
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
      typography: 'default',
      darkMode: 'auto',
      locale: 'auto'
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
