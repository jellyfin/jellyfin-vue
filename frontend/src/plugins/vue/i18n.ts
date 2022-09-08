import VueI18n from 'vue-i18n';

export const DEFAULT_LANGUAGE = 'en';
export const BROWSER_LANGUAGE = navigator?.language?.split('-')[0];

function getMessages() {
  const messages: VueI18n.LocaleMessages = {};
  // See: https://vitejs.dev/guide/features.html#glob-import
  const localeFiles = import.meta.glob('../../locales/*.json');
  for (const path in localeFiles) {
    // E.g: ../../locales/de.json
    const pathParts = path.split('/');
    // E.g: de.json -> de
    const locale = pathParts[pathParts.length - 1].slice(0, -5);
    // E.g: "de" => { "Hello": "Hallo" }
    // @ts-ignore - No types for this as strings are loaded dynamically at runtime
    messages[locale] = localeFiles[path].default;
  }
  return messages;
}

const messages = getMessages();
const i18n = new VueI18n({
  locale: Object.keys(messages).includes(BROWSER_LANGUAGE)
    ? BROWSER_LANGUAGE
    : DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages
});

export default i18n;
