import { defineConfig } from '@x18n/core';

export const defaultConfig = defineConfig({
  sourceLocale: 'en',
  /**
   * The project uses i18next-vue: the vue-i18n preset is needed to pick up
   * the t() calls inside templates
   */
  presets: [
    'i18next',
    'vue-i18n'
  ],
  keyStyle: 'flat',
  write: {
    sort: 'binary'
  },
  checks: {
    'unused-key': 'error'
  }
});
