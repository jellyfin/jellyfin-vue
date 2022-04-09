import { defineStore } from 'pinia';
import { authStore, snackbarStore } from '.';
import nuxtConfig from '~/nuxt.config';
import { fetchSettingsFromServer } from '~/plugins/store/plugins/preferencesSync';

/**
 * Cast typings for the CustomPrefs property of DisplayPreferencesDto
 */
export interface ClientSettingsState {
  darkMode: boolean;
  locale: string;
  lastSync: number | null;
}

export const clientSettingsStore = defineStore('clientSettings', {
  state: () => {
    return {
      darkMode:
        nuxtConfig.vuetify?.theme?.dark !== undefined
          ? nuxtConfig.vuetify?.theme?.dark
          : true,
      locale: 'auto',
      lastSync: null
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
      const auth = authStore();
      const snackbar = snackbarStore();

      try {
        const data = await fetchSettingsFromServer(this.$nuxt, auth, this);

        if (data.CustomPrefs) {
          this.$patch(data.CustomPrefs);
        }
      } catch {
        snackbar.push(
          this.$nuxt.i18n.t('failedSettingDisplayPreferences'),
          'error'
        );
      }
    }
  }
});
