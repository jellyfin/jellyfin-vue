import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import { useNavigatorLanguage } from '@vueuse/core';
import { computed } from 'vue';

const DEFAULT_LANGUAGE = 'en-US';
const BROWSER_LANGUAGE = computed<string>(
  () => useNavigatorLanguage().language.value || ''
);

const i18n = createI18n({
  fallbackLocale: DEFAULT_LANGUAGE,
  globalInjection: true,
  legacy: false,
  locale: Object.keys(messages).includes(BROWSER_LANGUAGE.value)
    ? BROWSER_LANGUAGE.value
    : DEFAULT_LANGUAGE,

  messages
});

export const languageMap = {
  am: 'አማርኛ',
  ar: 'العربية',
  be: 'беларуская мова',
  ca: 'Català',
  cs: 'Čeština',
  de: 'Deutsch',
  el: 'ελληνικά',
  'en-US': 'English',
  eo: 'Esperanto',
  es: 'Español',
  'es-419': 'Español (América Latina)',
  et: 'Eesti keel',
  fa: 'فارسی',
  fi: 'Suomi',
  fil: 'Pilipino',
  'fr-FR': 'Français',
  he: 'עברית',
  hi: 'हिन्दी',
  hu: 'Magyar',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  kk: 'қазақ тілі',
  ko: '한국어',
  lt: 'Lietuvių kalba',
  ml: 'മലയാളം',
  mn: 'Монгол хэл',
  ms: 'بهاس ملايو‎',
  my: 'မြန်မာဘာသာစကား',
  'nb-NO': 'Norsk',
  nl: 'Nederlands',
  nn: 'Norsk Nynorsk',
  pa: 'ਪੰਜਾਬੀ',
  pl: 'Polski',
  pt: 'Português',
  'pt-BR': 'Português (Brasil)',
  ro: 'Română',
  ru: 'русский',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  'sr-Latn': 'српски језик',
  sv: 'Svenska',
  sw: 'Kiswahili',
  ta: 'தமிழ்',
  tr: 'Türkçe',
  uk: 'Українська',
  ur: 'اردو',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文'
};

// @ts-expect-error - This is the only place where we need to assign the localeNames variable.
// Assigning it somewhere else should be completely restricted
i18n.global.localeNames = languageMap;

export default i18n;
