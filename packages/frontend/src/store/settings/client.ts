import {
  useNavigatorLanguage,
  watchImmediate
} from '@vueuse/core';
import { computed } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import type { KeysOfUnion } from 'type-fest';
import i18next from 'i18next';
import { languages } from '@jellyfin-vue/i18n';
import { vuetify } from '#/plugins/vuetify.ts';
import { SyncedStore } from '#/store/super/synced-store.ts';

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
    this._navigatorLanguage.language.value?.split('-', 1)[0]
  );

  /**
   * @param mode - If setting to undefined, auto locale is used
   */
  public readonly locale = computed({
    get: () => this._state.value.locale,
    set: (newVal?: string) => {
      const isAuto = isNil(newVal) || !languages.includes(newVal);

      this._state.value.locale = isAuto ? undefined : newVal;
    }
  });

  /**
   * == METHODS ==
   */
  private readonly _updateLocale = async (): Promise<void> => {
    const targetLocale = isNil(this.locale.value) ? this._BROWSER_LANGUAGE.value : this.locale.value;

    if (targetLocale) {
      vuetify.locale.current.value = targetLocale;
      await i18next.changeLanguage(targetLocale);
    }
  };

  /**
   * Creates the store, ensuring the user's locale is fully loaded before resolving
   */
  public static async create(): Promise<ClientSettingsStore> {
    const store = new ClientSettingsStore();

    await store._updateLocale();

    /**
     * Registered after the initial load to avoid racing with it. It's immediate so that
     * changes that happened while loading (e.g. server sync, other tabs) are not lost
     */
    watchImmediate(
      [store._BROWSER_LANGUAGE, store.locale],
      store._updateLocale
    );

    return store;
  }

  private constructor() {
    super({
      defaultState: () => ({
        locale: undefined
      }),
      storeKey: 'clientSettings',
      resetOnLogout: true,
      persistenceType: 'localStorage'
    });

    /**
     * Full initialization logic (initial locale load and watchers) is inside the create() method
     */
  }
}

export const clientSettings = await ClientSettingsStore.create();
