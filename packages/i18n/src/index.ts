import i18next from 'i18next';
import { resources } from 'virtual:i18next/resources';

/**
 * In @jellyfin-vue/frontend, see #/store/clientSettings to check where the current user language is initialised
 */

const DEFAULT_LANGUAGE = 'en';

await i18next.init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  debug: import.meta.env.DEV,
  nonExplicitSupportedLngs: true,
  interpolation: {
    escapeValue: false
  },
  resources
});

export const languages = Object.keys(resources);
