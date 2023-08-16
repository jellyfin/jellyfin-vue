import { createI18n, I18nOptions } from 'vue-i18n';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import messages from '@intlify/unplugin-vue-i18n/messages';

/**
 * See @/store/clientSettings to check where the current user language is initialised
 */

const DEFAULT_LANGUAGE = 'en-US';

const i18n = createI18n({
  fallbackLocale: DEFAULT_LANGUAGE,
  globalInjection: true,
  legacy: false,
  messages: messages as I18nOptions['messages']
});

export default i18n;
