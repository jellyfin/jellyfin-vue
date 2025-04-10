import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { defineConfig } from 'eslint/config';
import { findUpSync } from 'find-up-simple';
import unicorn from 'eslint-plugin-unicorn';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { configs as dependConfigs } from 'eslint-plugin-depend';
import gitignore from 'eslint-config-flat-gitignore';
import fileProgress from 'eslint-plugin-file-progress';
import { eqeqeqConfig } from '../shared';

const CI_environment = !!process.env.CI;

/**
 * Gets ESLint's minimal configuration for the monorepo
 *
 * @param packageName - The name of the current package
 * @param forceCache - Whether to enable ESLint caching for this run (default `true`)
 * @param warningAsErrors - All warnings are treated as errors (default `true`)
 */
export function getBaseConfig(packageName: string, forceCache = !CI_environment, warningAsErrors = true) {
  const cliOverrides = forceCache || warningAsErrors;

  /**
   * Workaround for implementing https://github.com/eslint/eslint/issues/19015
   * Stops the current process if the necessary flags are provided, and spawn a new one with the appropiate flags
   * inheriting it.
   *
   * This is necessary to have predictable ESLint runs across the board, without having to worry about specifying the
   * correct flags for each monorepo package.
   * We check for eslint directly to avoid messing up with other packages reading this file, like @eslint/config-inspector.
   */
  if (cliOverrides && process.argv[1] && basename(process.argv[1]) === 'eslint') {
    const newArgs = process.argv.slice(1);

    if (forceCache && !(newArgs.includes('--cache') && newArgs.includes('--cache-location'))) {
      const cacheLocation = resolve(findUpSync('node_modules', { type: 'directory' }) ?? '', '.cache/eslint', packageName.replace('/', '_'));

      newArgs.push('--cache', '--cache-location', cacheLocation);
      console.log(`[@jellyfin-vue/configs/lint] (${packageName}) Force enabling caching for this run`);
    }

    if (warningAsErrors && !newArgs.some(arg => arg.includes('--max-warnings'))) {
      newArgs.push('--max-warnings=0');
      console.log(`[@jellyfin-vue/configs/lint] (${packageName}) Force enabling warnings for this run`);
    }

    const argsHaveChanged = new Set(newArgs).difference(new Set(process.argv.slice(1))).size > 0;

    if (argsHaveChanged && process.argv[0]) {
      console.log();

      const result = spawnSync(process.argv[0], newArgs, {
        stdio: 'inherit',
        maxBuffer: Number.MAX_SAFE_INTEGER
      });

      process.exit(result.status ?? 0);
    }
  }

  return defineConfig([
    { ...js.configs.recommended,
      name: '(@jellyfin-vue/configs/lint/base - eslint) Extended config from plugin'
    },
    {
      ...unicorn.configs['recommended'],
      name: '(@jellyfin-vue/configs/lint/base - unicorn) Extended config from plugin'
    },
    {
      ...dependConfigs['flat/recommended'],
      name: '(@jellyfin-vue/configs/lint/base - depend) Extended config from plugin'
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
      name: '(@jellyfin-vue/configs/lint/base - @stylistic) Extended config from plugin'
    },
    {
      name: '(@jellyfin-vue/configs/lint/base) Common settings',
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
      name: '(@jellyfin-vue/configs/lint/base) Disable stylistic legacy rules'
    },
    /**
     * Extra files to include and ignores that should override all the others
     */
    {
      name: '(@jellyfin-vue/configs/lint/base) Ignored files',
      ignores: [
        '**/.git',
        ...gitignore().ignores
      ]
    },
    /** File progress plugin */
    {
      name: '(@jellyfin-vue/configs/lint/base) Linting progress report',
      settings: {
        progress: {
          successMessage: 'Linting done!'
        }
      },
      plugins: {
        'file-progress': fileProgress
      },
      rules: {
        'file-progress/activate': CI_environment ? 0 : 1
      }
    }
  ]);
};
