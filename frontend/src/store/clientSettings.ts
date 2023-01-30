import { computed, watch, nextTick } from 'vue';
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
 * == STATE VARIABLES ==
 */
const defaultState = {
  darkMode: usePreferredDark().value,
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
 * == UTILITY VARIABLES ==
 */
const languageCodes = new Set(Object.keys(usei18n().localeNames)).add('auto');

/**
 * == CLASS CONSTRUCTOR ==
 */
class ClientSettingsStore {
  public set locale(newVal: string) {
    if (!languageCodes.has(newVal)) {
      throw new TypeError('This locale is not registered yet');
    }

    state.value.locale = newVal;
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
}

const clientSettings = new ClientSettingsStore();

/**
 * == WATCHERS ==
 */

/**
 * Fetch data when the user logs in
 */
const remote = useRemote();

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
 * Sync data with server
 */
const syncDataWatcher = watchPausable(
  state,
  async () => {
    if (remote.auth.currentUser) {
      await preferencesSync(storeKey, state.value);
    }
  },
  { deep: true }
);

/**
 * Locale change
 */
const BROWSER_LANGUAGE = computed<string>(() => {
  const rawString = useNavigatorLanguage().language.value || '';
  /**
   * Removes the culture info from the language string, so 'es-ES' is recognised as 'es'
   */
  const cleanString = rawString.split('-');

  return cleanString[0];
});

watch(BROWSER_LANGUAGE, () => (clientSettings.locale = BROWSER_LANGUAGE.value));

watch(
  () => state.value.locale,
  () => {
    const i18n = usei18n();

    i18n.locale.value =
      state.value.locale !== 'auto'
        ? state.value.locale
        : BROWSER_LANGUAGE.value || String(i18n.fallbackLocale.value);
  },
  { immediate: true }
);

/**
 * Vuetify theme change
 */
watch(usePreferredDark(), () => {
  state.value.darkMode = usePreferredDark().value;
});

watch(
  () => state.value.darkMode,
  () => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const vuetify = useVuetify();

        vuetify.theme.global.name.value = state.value.darkMode
          ? 'dark'
          : 'light';
      });
    });
  },
  { immediate: true }
);

export default clientSettings;
