import { createI18n } from 'vue-i18n';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import messages from '@intlify/unplugin-vue-i18n/messages';

/**
 * See @/store/clientSettings to check where the current user language is initialised
 */

const DEFAULT_LANGUAGE = 'en';

export const vuePlugin = createI18n({
  fallbackLocale: DEFAULT_LANGUAGE,
  globalInjection: true,
  legacy: false,
  messages: messages
});

export const i18n = vuePlugin.global;
