import { defineConfig } from 'eslint/config';
import jsonc from 'eslint-plugin-jsonc';

const jsoncRecommended = jsonc.configs['flat/recommended-with-json'];

export const json = defineConfig([
  {
    /* First index is just the plugin definition */
    ...jsoncRecommended.at(0),
    ...jsoncRecommended.at(1),
    name: '(@jellyfin-vue/configs/lint/json) - Custom config',
    rules: {
      ...jsoncRecommended.at(1)!.rules,
      ...jsoncRecommended.at(2)!.rules,
      'jsonc/auto': 'error',
      '@stylistic/quotes': ['error', 'double'],
      '@stylistic/semi': 'off',
      '@stylistic/quote-props': 'off'
    }
  }
]);
