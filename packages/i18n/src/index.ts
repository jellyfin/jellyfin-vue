import i18next from 'i18next';
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
    read: async (language: string, _, done) => {
      const promise = resources[language] as Promise<Record<string, string>>;
      const data = await promise();

      done(undefined, data);
    }
  })
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
