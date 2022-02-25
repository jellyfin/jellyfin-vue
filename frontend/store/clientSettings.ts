import { defineStore } from 'pinia';
import nuxtConfig from '~/nuxt.config';

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
    setLastSyncDate(): void {
      this.lastSync = Date.now();
    }
  }
});
