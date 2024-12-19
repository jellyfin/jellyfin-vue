import {
  useNavigatorLanguage,
  usePreferredDark,
  watchImmediate
} from '@vueuse/core';
import { computed } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import { i18n } from '@/plugins/i18n';
import { vuetify } from '@/plugins/vuetify';
import { SyncedStore } from '@/store/super/synced-store';
import type { TypographyChoices } from '@/store';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export interface ClientSettingsState {
  typography: TypographyChoices;
  darkMode?: boolean;
  locale?: string;
}

@sealed
class ClientSettingsStore extends SyncedStore<ClientSettingsState, 'typography'> {
  private readonly _dark = 'dark' as const;
  private readonly _light = 'light' as const;
  private readonly _browserPrefersDark = usePreferredDark();
  private readonly _navigatorLanguage = useNavigatorLanguage();
  private readonly _BROWSER_LANGUAGE = computed(() =>
    /**
     * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
     */
    this._navigatorLanguage.language.value?.split('-')[0]
  );

  /**
   * @param mode - If setting to undefined, auto locale is used
   */
  public readonly locale = computed({
    get: () => this._state.value.locale,
    set: (newVal?: string) => {
      const isAuto = isNil(newVal) || !i18n.availableLocales.includes(newVal);

      this._state.value.locale = isAuto ? undefined : newVal;
    }
  });

  /**
   * @param mode - If true, sets the theme to dark, if false, to light. `undefined` sets it to auto
   */
  public readonly currentTheme = computed({
    get: () => {
      const browserColor = this._browserPrefersDark.value ? this._dark : this._light;
      const userColor
      = this._state.value.darkMode ? this._dark : this._light;

      return this.isAutoTheme.value ? browserColor : userColor;
    },
    set: (mode?: boolean) => {
      this._state.value.darkMode = mode;
    }
  });

  public readonly isAutoTheme = computed(() => isNil(this._state.value.darkMode));
  public readonly currentThemeIsDark = computed(() => this.currentTheme.value === this._dark);

  /**
   * == METHODS ==
   */
  private readonly _updateLocale = (): void => {
    const targetLocale = isNil(this.locale.value) ? this._BROWSER_LANGUAGE.value : this.locale.value;

    if (targetLocale) {
      i18n.locale.value = targetLocale;
      vuetify.locale.current.value = i18n.locale.value;
    }
  };

  public constructor() {
    super({
      defaultState: () => ({
        typography: 'default',
        darkMode: undefined,
        locale: undefined
      }),
      storeKey: 'clientSettings',
      resetOnLogout: true,
      persistenceType: 'localStorage'
    });
    /**
     * == WATCHERS ==
     */

    /**
     * Locale change
     */
    watchImmediate(
      [this._BROWSER_LANGUAGE, this.locale],
      this._updateLocale
    );

    /**
     * Vuetify theme change
     */
    watchImmediate(this.currentTheme, () => {
      globalThis.requestAnimationFrame(() => {
        vuetify.theme.global.name.value
          = this.currentTheme.value;
      });
    });
  }
}

export const clientSettings = new ClientSettingsStore();
