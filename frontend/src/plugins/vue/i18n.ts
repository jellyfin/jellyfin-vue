import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import { useNavigatorLanguage } from '@vueuse/core';
import { computed } from 'vue';

const DEFAULT_LANGUAGE = 'en-US';
const BROWSER_LANGUAGE = computed<string>(
  () => useNavigatorLanguage().language.value || ''
);

const i18n = createI18n({
  locale: Object.keys(messages).includes(BROWSER_LANGUAGE.value)
    ? BROWSER_LANGUAGE.value
    : DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages,
  globalInjection: true,
  legacy: false
});

export default i18n;
