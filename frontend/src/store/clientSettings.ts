import { defineStore } from 'pinia';
import { usePreferredDark } from '@vueuse/core';
import { fetchSettingsFromServer } from '~/plugins/store/preferencesSync';
import { usei18n, useSnackbar } from '@/composables';

/**
 * Cast typings for the CustomPrefs property of DisplayPreferencesDto
 */
export interface ClientSettingsState {
  darkMode: boolean;
  locale: string;
  lastSync: number | undefined;
}

export const clientSettingsStore = defineStore('clientSettings', {
  state: () => {
    return {
      darkMode: usePreferredDark().value,
      locale: 'auto',
      lastSync: undefined
    } as ClientSettingsState;
  },
  actions: {
    setDarkMode(darkMode: boolean): void {
      this.darkMode = darkMode;
    },
    setLocale(locale: string): void {
      this.locale = locale;
    },
    async initState(): Promise<void> {
      const { t } = usei18n();

      try {
        const data = await fetchSettingsFromServer(this);

        if (data.CustomPrefs) {
          this.$patch(data.CustomPrefs);
        }
      } catch {
        useSnackbar(t('failedSettingDisplayPreferences'), 'error');
      }
    }
  }
});
