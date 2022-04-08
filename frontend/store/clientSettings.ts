import { defineStore } from 'pinia';
import nuxtConfig from '~/nuxt.config';
import { fetchSettingsFromServer } from '~/plugins/store/plugins/preferencesSync';
import { authStore } from '.';

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

      const data = await fetchSettingsFromServer(this.$nuxt, auth, this.$id);
      // @ts-expect-error - Everything is dynamic at runtime, so we need to exclude type checking here.
      this.$patch(data.CustomPrefs);
    }
  }
});
