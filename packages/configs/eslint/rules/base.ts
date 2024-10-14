import type { Linter } from 'eslint';
/*
 * import { join } from 'node:path';
 * import { findUpSync } from 'find-up-simple';
 */
import unicorn from 'eslint-plugin-unicorn';
// @ts-expect-error - No types available
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { configs as dependConfigs } from 'eslint-plugin-depend';
import gitignore from 'eslint-config-flat-gitignore';
// @ts-expect-error - No types available
import fileProgress from 'eslint-plugin-file-progress';
import { eqeqeqConfig } from '../shared';

const CI_environment = process.env.CI ? 0 : 1;

/**
 * Gets ESLint's minimal configuration for the monorepo
 *
 * @param packageName - The name of the current package
 */
export function getBaseConfig(packageName: string): Linter.Config[] {
  return [
    /*
     * TODO: Wait for https://github.com/eslint/eslint/issues/19015
     * {
     *   cache: true,
     *   cacheLocation: join(findUpSync('node_modules', { type: 'directory' }) ?? '', '.cache/eslint', packageName.replace('/', '_')),
     * },
     */
    { ...js.configs.recommended,
      name: '(@jellyfin-vue/configs/eslint/base - eslint) Extended config from plugin'
    },
    {
      ...unicorn.configs['flat/recommended'],
      name: '(@jellyfin-vue/configs/eslint/base - unicorn) Extended config from plugin'
    },
    {
      ...dependConfigs['flat/recommended'],
      name: '(@jellyfin-vue/configs/eslint/base - depend) Extended config from plugin'
    },
    {
      ...stylistic.configs.customize({
        quotes: 'single',
        semi: true,
        commaDangle: 'never',
        braceStyle: '1tbs',
        arrowParens: false,
        blockSpacing: true
      }),
      name: '(@jellyfin-vue/configs/eslint/base - @stylistic) Extended config from plugin'
    },
    {
      name: '(@jellyfin-vue/configs/eslint/base) Common settings',
      rules: {
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-extend-native': 'error',
        'curly': ['error', 'all'],
        'prefer-arrow-callback': 'error',
        'multiline-comment-style': 'error',
        'unicode-bom': ['error', 'never'],
        'eqeqeq': eqeqeqConfig,
        '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
        '@stylistic/linebreak-style': ['error', 'unix'],
        'unicorn/import-style': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/no-await-expression-member': 'off',
        /**
         * See https://github.com/jellyfin/jellyfin-vue/pull/2361
         */
        'unicorn/explicit-length-check': 'off',
        '@stylistic/padding-line-between-statements': [
          'error',
          // Always require blank lines after import, except between imports
          { blankLine: 'always', prev: 'import', next: '*' },
          { blankLine: 'never', prev: 'import', next: 'import' },
          // Always require blank lines before and after every sequence of variable declarations and export
          {
            blankLine: 'always',
            prev: '*',
            next: ['const', 'let', 'var', 'export']
          },
          {
            blankLine: 'always',
            prev: ['const', 'let', 'var', 'export'],
            next: '*'
          },
          {
            blankLine: 'any',
            prev: ['const', 'let', 'var', 'export'],
            next: ['const', 'let', 'var', 'export']
          },
          {
            blankLine: 'any',
            prev: ['block-like'],
            next: '*'
          },
          // Always require blank lines before and after class declaration, if, do/while, switch, try
          {
            blankLine: 'always',
            prev: '*',
            next: ['if', 'class', 'for', 'do', 'while', 'switch', 'try']
          },
          {
            blankLine: 'always',
            prev: ['if', 'class', 'for', 'do', 'while', 'switch', 'try'],
            next: '*'
          },
          // Always require blank lines before return statements
          { blankLine: 'always', prev: '*', next: 'return' }
        ]
      }
    },
    {
      ...stylistic.configs['disable-legacy'],
      name: '(@jellyfin-vue/configs/eslint/base) Disable stylistic legacy rules'
    },
    /**
     * Extra files to include and ignores that should override all the others
     */
    {
      name: '(@jellyfin-vue/configs/eslint/base) Ignored files',
      ignores: [
        '**/.git',
        ...gitignore().ignores
      ]
    },
    /** File progress plugin */
    {
      name: '(@jellyfin-vue/configs/eslint/base) Linting progress report',
      settings: {
        progress: {
          successMessage: 'Linting done!'
        }
      },
      plugins: {
        'file-progress': fileProgress
      },
      rules: {
        'file-progress/activate': CI_environment
      }
    }
  ];
};
