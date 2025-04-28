import i18next, { type ResourceLanguage } from 'i18next';

/**
 * In @jellyfin-vue/frontend, see #/store/clientSettings to check where the current user language is initialised
 */

const DEFAULT_LANGUAGE = 'en';
const resources = import.meta.glob<ResourceLanguage>('/strings/*.json', { eager: true });

await i18next.init({
  fallbackLng: DEFAULT_LANGUAGE,
  lng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false
  },
  resources
});
