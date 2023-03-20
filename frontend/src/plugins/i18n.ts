import { createI18n } from 'vue-i18n';
// eslint-disable-next-line import/no-extraneous-dependencies
import messages from '@intlify/unplugin-vue-i18n/messages';

/**
 * See @/store/clientSettings to check where the current user language is initialised
 */

/* eslint sort-keys: "error" */
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
  th: 'ภาษาไทย',
  tr: 'Türkçe',
  uk: 'Українська',
  ur: 'اردو',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文'
};
/* eslint sort-keys: "off" */

const DEFAULT_LANGUAGE = 'en-US';

const i18n = createI18n({
  fallbackLocale: DEFAULT_LANGUAGE,
  globalInjection: true,
  legacy: false,
  messages
});

// `localeNames` is readonly but this is the one place it should actually be set
(i18n.global.localeNames as typeof languageMap) = languageMap;

export default i18n;
