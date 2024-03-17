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

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export interface ClientSettingsState {
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
    this._state.locale =
      i18n.availableLocales.includes(newVal) && newVal !== 'auto'
        ? newVal : 'auto';
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

  private readonly _updateLocale = (): void => {
    i18n.locale.value =
      this.locale === 'auto'
        ? this._BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value)
        : this.locale;
    vuetify.locale.current.value = i18n.locale.value;
  };

  private readonly _updateTheme = (): void => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const dark = 'dark';
        const light = 'light';
        const browserColor = this._browserPrefersDark.value ? dark : light;
        const userColor =
          this.darkMode !== 'auto' && this.darkMode ? dark : light;

        vuetify.theme.global.name.value =
          this.darkMode === 'auto' ? browserColor : userColor;
      });
    });
  };

  public constructor() {
    super('clientSettings', {
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
    watchImmediate(
      [this._browserPrefersDark, (): typeof this.darkMode => this.darkMode],
      this._updateTheme
    );

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
