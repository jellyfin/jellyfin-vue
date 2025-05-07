import i18next, { type BackendModule } from 'i18next';
import { NOOP } from '@vue/shared';
import { resources } from 'virtual:i18next/resources';

/**
 * In @jellyfin-vue/frontend, see #/store/clientSettings to check where the current user language is initialised
 */

const DEFAULT_LANGUAGE = 'en';

await i18next
  /**
   * Lazy load the used locales only to save memory
   */
  .use({
    type: 'backend',
    init: NOOP,
    read: (language, _, done) => {
      const loadFn = resources[language];

      if (loadFn) {
        void (async () => done(undefined, await loadFn()))();
      } else {
        done(new Error(`Language ${language} not found`), {});
      }
    }
  } satisfies BackendModule)
  .init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: import.meta.env.DEV,
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false
    }
  });

export const languages = Object.freeze(Object.keys(resources));
