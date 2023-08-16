import { computed, watch, nextTick } from 'vue';
import {
  RemovableRef,
  useNavigatorLanguage,
  usePreferredDark,
  useStorage,
  watchPausable
} from '@vueuse/core';
import { fetchDefaultedCustomPrefs, syncCustomPrefs } from '@/utils/store-sync';
import { usei18n, useSnackbar, useRemote, useVuetify } from '@/composables';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

interface ClientSettingsState {
  darkMode: 'auto' | boolean;
  locale: 'auto';
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
    const i18n = usei18n();

    if (!i18n.availableLocales.includes(newVal) && newVal !== 'auto') {
      throw new TypeError('This locale has not been registered');
    }

    this._state.value.locale =
      newVal === 'auto' ? String(i18n.fallbackLocale.value) : newVal;
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
    const i18n = usei18n();
    const vuetify = useVuetify();

    i18n.locale.value =
      this.locale === 'auto'
        ? BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value)
        : this.locale;
    vuetify.locale.current.value = i18n.locale.value;
  };

  private _updateTheme = (): void => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const vuetify = useVuetify();
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
    const remote = useRemote();
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
            const { t } = usei18n();

            useSnackbar(t('failedSettingDisplayPreferences'), 'error');
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

const clientSettings = new ClientSettingsStore();

export default clientSettings;
