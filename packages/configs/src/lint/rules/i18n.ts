import { defineConfig } from 'eslint/config';
import i18nPlugin from '@intlify/eslint-plugin-vue-i18n';
import { vueAndTsFiles } from '../shared';

export const i18n = defineConfig([
  {
    /* First index is just the plugin definition */
    ...i18nPlugin.configs['flat/recommended'].at(0),
    /* Last contains the rule definitions */
    ...i18nPlugin.configs['flat/recommended'].at(-1),
    name: '(@intlify/vue-i18n) Extended config (plugin & settings)',
    settings: {
      'vue-i18n': {
        localeDir: 'locales/en.json',
        messageSyntaxVersion: '^9.0.0'
      }
    },
    files: vueAndTsFiles
  },
  {
    name: '(@intlify/vue-i18n) Custom config',
    files: vueAndTsFiles,
    rules: {
      '@intlify/vue-i18n/no-unused-keys': ['error', {
        extensions: ['.ts', '.vue', '.json'],
        enableFix: true
      }],
      '@intlify/vue-i18n/no-raw-text': ['error', {
        ignorePattern: '^[-#:()&.]+$'
      }],
      '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/key-format-style': 'error'
    }
  },
  /**
   * See the following:
   * - https://en.wikipedia.org/wiki/History_of_sentence_spacing#French_and_English_spacing
   * - https://docs.weblate.org/en/weblate-4.14.1/user/checks.html#check-punctuation-spacing
   */
  {
    name: '(@intlify/vue-i18n - fr) Config exceptions for linguistic rules',
    files: ['locales/fr.json'],
    rules: {
      'no-irregular-whitespace': 'off'
    }
  }
]);
