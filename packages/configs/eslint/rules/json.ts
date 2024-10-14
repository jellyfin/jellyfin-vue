import type { Linter } from 'eslint';
import jsonc from 'eslint-plugin-jsonc';

const jsoncRecommended = jsonc.configs['flat/recommended-with-json'];

export const json = [
  {
    /* First index is just the plugin definition */
    ...jsoncRecommended.at(0),
    ...jsoncRecommended.at(1),
    name: '(@jellyfin-vue/configs/eslint/json) - Custom config',
    rules: {
      ...jsoncRecommended.at(1).rules,
      ...jsoncRecommended.at(2).rules,
      'jsonc/auto': 'error',
      '@stylistic/quotes': ['error', 'double'],
      '@stylistic/semi': 'off',
      '@stylistic/quote-props': 'off'
    }
  }
] satisfies Linter.Config[];
