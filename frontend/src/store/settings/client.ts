import {
  useNavigatorLanguage,
  watchImmediate
} from '@vueuse/core';
import { computed } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import type { KeysOfUnion } from 'type-fest';
import { i18n } from '#/plugins/i18n';
import { vuetify } from '#/plugins/vuetify';
import { SyncedStore } from '#/store/super/synced-store';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export interface ClientSettingsState {
  locale?: string;
}

@sealed
class ClientSettingsStore extends SyncedStore<ClientSettingsState, KeysOfUnion<ClientSettingsState>> {
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
  }
}

export const clientSettings = new ClientSettingsStore();
