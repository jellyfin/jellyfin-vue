import { createI18n } from 'vue-i18n';

const DEFAULT_LANGUAGE = 'en';
const BROWSER_LANGUAGE = navigator?.language?.split('-')[0];

/**
 *
 */
function getMessages() {
  const messages: any = {};
  // See: https://vitejs.dev/guide/features.html#glob-import
  const localeFiles = import.meta.glob('../../locales/*.json');

  for (const path in localeFiles) {
    // E.g: ../../locales/de.json
    const pathParts = path.split('/');
    // E.g: de.json -> de
    const locale = pathParts[pathParts.length - 1].slice(0, -5);

    // E.g: "de" => { "Hello": "Hallo" }
    // @ts-expect-error - No types for this as strings are loaded dynamically at runtime
    messages[locale] = localeFiles[path].default;
  }

  return messages;
}

const messages = getMessages();
const i18n = createI18n({
  locale: Object.keys(messages).includes(BROWSER_LANGUAGE)
    ? BROWSER_LANGUAGE
    : DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  legacy: false, // Enables $t(), $tc(), etc in templates
  messages,
  globalInjection: true
});

export default i18n;
