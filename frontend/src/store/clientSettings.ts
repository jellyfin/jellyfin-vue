import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';
import { remote } from '@/plugins/remote';
import { vuetify } from '@/plugins/vuetify';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { fetchDefaultedCustomPrefs, syncCustomPrefs } from '@/utils/store-sync';
import {
  RemovableRef,
  useNavigatorLanguage,
  usePreferredDark,
  useStorage,
  watchPausable
} from '@vueuse/core';
import { computed, nextTick, watch } from 'vue';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

interface ClientSettingsState {
  darkMode: 'auto' | boolean;
  locale: string;
}

/**
 * == UTILITY VARIABLES ==
 */
const navigatorLanguage = useNavigatorLanguage();
const BROWSER_LANGUAGE = computed<string>(() => {
  const rawString = navigatorLanguage.language.value ?? '';
  /**
   * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
   */
  const cleanString = rawString.split('-');

  return cleanString[0];
});
const browserPrefersDark = usePreferredDark();
const storeKey = 'clientSettings';

/**
 * == CLASS CONSTRUCTOR ==
 */
class ClientSettingsStore {
  /**
   * == STATE SECTION ==
   */
  private _defaultState: ClientSettingsState = {
    darkMode: 'auto',
    locale: 'auto'
  };

  private _state: RemovableRef<ClientSettingsState> = useStorage(
    storeKey,
    structuredClone(this._defaultState),
    localStorage,
    {
      mergeDefaults: (storageValue, defaults) =>
        mergeExcludingUnknown(storageValue, defaults)
    }
  );

  /**
   * == GETTERS AND SETTERS ==
   */
  public set locale(newVal: string) {
    this._state.value.locale =
      i18n.availableLocales.includes(newVal) && newVal !== 'auto'
        ? newVal : 'auto';
  }

  public get locale(): string {
    return this._state.value.locale;
  }

  public set darkMode(newVal: 'auto' | boolean) {
    this._state.value.darkMode = newVal;
  }

  public get darkMode(): 'auto' | boolean {
    return this._state.value.darkMode;
  }

  private _updateLocale = (): void => {
    i18n.locale.value =
      this.locale === 'auto'
        ? BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value)
        : this.locale;
    vuetify.locale.current.value = i18n.locale.value;
  };

  private _updateTheme = (): void => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const dark = 'dark';
        const light = 'light';
        const browserColor = browserPrefersDark.value ? dark : light;
        const userColor =
          this.darkMode !== 'auto' && this.darkMode ? dark : light;

        vuetify.theme.global.name.value =
          this.darkMode === 'auto' ? browserColor : userColor;
      });
    });
  };

  private _clear = (): void => {
    Object.assign(this._state.value, this._defaultState);
  };

  public constructor() {
    /**
     * == WATCHERS ==
     */

    /**
     * Sync data with server
     */
    const syncDataWatcher = watchPausable(this._state, async () => {
      if (remote.auth.currentUser) {
        await syncCustomPrefs(storeKey, this._state.value);
      }
    });

    /**
     * Fetch data when the user logs in
     */
    watch(
      () => remote.auth.currentUser,
      async () => {
        if (remote.auth.currentUser) {
          try {
            const data = await fetchDefaultedCustomPrefs(
              storeKey,
              this._state.value
            );

            if (data) {
              syncDataWatcher.pause();
              Object.assign(this._state.value, data);
              await nextTick();
              syncDataWatcher.resume();
            }
          } catch {
            useSnackbar(i18n.t('failedSettingDisplayPreferences'), 'error');
          }
        }
      },
      { immediate: true }
    );

    /**
     * Locale change
     */

    watch(
      [BROWSER_LANGUAGE, (): typeof this.locale => this.locale],
      this._updateLocale,
      { immediate: true }
    );

    /**
     * Vuetify theme change
     */
    watch(
      [browserPrefersDark, (): typeof this.darkMode => this.darkMode],
      this._updateTheme,
      { immediate: true }
    );

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }
    );
  }
}

export const clientSettings = new ClientSettingsStore();
