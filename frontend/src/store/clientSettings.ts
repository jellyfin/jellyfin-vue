import { computed, watch, nextTick, toRaw } from 'vue';
import {
  RemovableRef,
  useNavigatorLanguage,
  usePreferredDark,
  useStorage,
  watchPausable
} from '@vueuse/core';
import { cloneDeep } from 'lodash-es';
import preferencesSync, { fetchSettingsFromServer } from '@/utils/store-sync';
import { usei18n, useSnackbar, useRemote, useVuetify } from '@/composables';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

/**
 * == INTERFACES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */
interface ClientSettingsState {
  darkMode: boolean;
  locale: string;
}

/**
 * == UTILITY VARIABLES ==
 */
const languageCodes = new Set(Object.keys(usei18n().localeNames)).add('auto');
const navigatorLanguage = useNavigatorLanguage();
const BROWSER_LANGUAGE = computed<string>(() => {
  const rawString = navigatorLanguage.language.value || '';
  /**
   * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
   */
  const cleanString = rawString.split('-');

  return cleanString[0];
});
const browserPrefersDark = usePreferredDark();

/**
 * == STATE VARIABLES ==
 */
const defaultState = {
  darkMode: toRaw(browserPrefersDark.value),
  locale: 'auto'
};

const storeKey = 'clientSettings';

const state: RemovableRef<ClientSettingsState> = useStorage(
  storeKey,
  cloneDeep(defaultState),
  localStorage,
  {
    mergeDefaults: (storageValue, defaults) =>
      mergeExcludingUnknown(storageValue, defaults)
  }
);

/**
 * == CLASS CONSTRUCTOR ==
 */
class ClientSettingsStore {
  public set locale(newVal: string) {
    if (!languageCodes.has(newVal)) {
      const i18n = usei18n();

      console.error('This locale is not registered yet:', newVal);
      state.value.locale = String(i18n.fallbackLocale.value);
    } else {
      state.value.locale = newVal;
    }
  }

  public get locale(): string {
    return state.value.locale;
  }

  public set darkMode(newVal: boolean) {
    state.value.darkMode = newVal;
  }

  public get darkMode(): boolean {
    return state.value.darkMode;
  }

  private _updateLocale = (): void => {
    const i18n = usei18n();

    i18n.locale.value =
      this.locale !== 'auto'
        ? this.locale
        : BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value);
  };

  public constructor() {
    const remote = useRemote();
    /**
     * == WATCHERS ==
     */

    /**
     * Sync data with server
     */
    const syncDataWatcher = watchPausable(state, async () => {
      if (remote.auth.currentUser) {
        await preferencesSync(storeKey, state.value);
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
            const data = await fetchSettingsFromServer<ClientSettingsState>(
              storeKey,
              state.value
            );

            if (data) {
              syncDataWatcher.pause();
              Object.assign(state.value, data);
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

    watch(BROWSER_LANGUAGE, this._updateLocale);
    watch(() => this.locale, this._updateLocale, { immediate: true });

    /**
     * Vuetify theme change
     */
    watch(browserPrefersDark, () => {
      state.value.darkMode = browserPrefersDark.value;
    });

    watch(
      () => this.darkMode,
      () => {
        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            const vuetify = useVuetify();

            vuetify.theme.global.name.value = this.darkMode ? 'dark' : 'light';
          });
        });
      },
      { immediate: true }
    );
  }
}

const clientSettings = new ClientSettingsStore();

export default clientSettings;
