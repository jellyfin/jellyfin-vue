import jsdoc from 'eslint-plugin-jsdoc';
import unicorn from 'eslint-plugin-unicorn';
import eslintImportX from 'eslint-plugin-import-x';
import fileProgress from 'eslint-plugin-file-progress';
import promise from 'eslint-plugin-promise';
import js from '@eslint/js';
import globals from 'globals';
import vueScopedCSS from 'eslint-plugin-vue-scoped-css';
import css from 'eslint-plugin-css';
import vue from 'eslint-plugin-vue';
import i18n from '@intlify/eslint-plugin-vue-i18n';
import { FlatCompat } from '@eslint/eslintrc';
import gitignore from 'eslint-config-flat-gitignore';
import stylistic from '@stylistic/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import jsonc from 'eslint-plugin-jsonc';
import regexp from 'eslint-plugin-regexp';
import { configs as dependConfigs } from 'eslint-plugin-depend';
import unocss from '@unocss/eslint-config/flat';

const tsFiles = ['*.ts', '**/*.ts'];
const vueFiles = ['*.vue', '**/*.vue'];
const vueAndTsFiles = [...vueFiles, ...tsFiles];
const CI_environment = process.env.CI ? 0 : 1;
const jsoncRecommended = jsonc.configs['flat/recommended-with-json'];

/**
 * Util functions
 * TODO: Can be removed once all ESLint plugins are updated to support Flat config
 */
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});
const flatArrayOfObjects = obj => Object.assign({}, ...obj);

export default tseslint.config(
  /** Global settings */
  { ...js.configs.recommended,
    name: '(eslint) Extended config from plugin'
  },
  {
    ...unicorn.configs['flat/recommended'],
    name: '(unicorn) Extended config from plugin'
  },
  {
    ...dependConfigs['flat/recommended'],
    name: '(depend) Extended config from plugin'
  },
  {
    ...unocss,
    name: '(unocss) Extended config from plugin'
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
    name: '(@stylistic) Extended config from plugin'
  },
  {
    name: 'Common settings',
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-extend-native': 'error',
      'curly': ['error', 'all'],
      'prefer-arrow-callback': 'error',
      'multiline-comment-style': 'error',
      'unicode-bom': ['error', 'never'],
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
  /** Common TypeScript rules */
  {
    name: '(TypeScript & Vue) - Parser config',
    files: vueAndTsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        warnOnUnsupportedTypeScriptVersion: false,
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    ...flatArrayOfObjects(tseslint.configs.strictTypeChecked),
    name: '(typescript-eslint) Extended config from plugin (strict type checking)',
    files: vueAndTsFiles
  },
  {
    ...flatArrayOfObjects(tseslint.configs.stylisticTypeChecked),
    name: '(typescript-eslint) Extended config from plugin (stylistic type checking)',
    files: vueAndTsFiles
  },
  {
    ...tseslint.configs.eslintRecommended,
    files: vueAndTsFiles,
    name: '(typescript-eslint) Extended config from plugin (ESLint rules with type checking)'
  },
  {
    ...regexp.configs['flat/recommended'],
    name: '(regexp) Extended config from plugin',
    files: vueAndTsFiles
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:you-dont-need-lodash-underscore/all')),
    name: '(you-dont-need-lodash) Extended config from plugin',
    files: vueAndTsFiles
  },
  {
    ...promise.configs['flat/recommended'],
    name: '(promise) Extended config from plugin',
    files: vueAndTsFiles
  },
  {
    name: '(promise) Custom config',
    files: vueAndTsFiles,
    rules: {
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error'
    }
  },
  {
    name: '(import) Custom config',
    // TODO: Remove after: https://github.com/eslint/eslint/pull/18134
    files: [...vueAndTsFiles, '**/*.js'],
    plugins: {
      'import-x': eslintImportX
    },
    rules: {
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/order': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-nodejs-modules': 'error',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true, 'considerQueryString': true }],
      // From the recommended preset
      'import-x/named': 'error',
      'import-x/export': 'error'
    }
  },
  {
    files: vueAndTsFiles,
    name: '(JSDoc) Custom config',
    plugins: {
      jsdoc
    },
    rules: {
      'jsdoc/require-hyphen-before-param-description': 'error',
      'jsdoc/require-description': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-jsdoc': 'error',
      'jsdoc/informative-docs': 'error'
    }
  },
  {
    name: '(TypeScript & Vue) Custom config',
    files: vueAndTsFiles,
    rules: {
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }]
    }
  },
  {
    ...sonarjs.configs.recommended,
    name: '(sonarcloud) Extended config from plugin',
    files: vueAndTsFiles
  },
  /** SFC rules */
  ...vue.configs['flat/recommended'].map((config) => {
    /**
     * Specified above, unnecessary to overwrite
     */
    delete config.languageOptions?.globals;
    /**
     * DEPRECATED: See https://eslint.vuejs.org/rules/component-tags-order.html#vue-component-tags-order
     * TODO: Remove when it's removed from the recommended rules
     */
    delete config.rules?.['vue/component-tags-order'];
    config.name = `(${config.name}) - Extended config from plugin`;

    return config;
  }),
  {
    ...flatArrayOfObjects(vueScopedCSS.configs['flat/recommended']),
    name: '(Vue - Scoped CSS) Extended config from plugin'
  },
  {
    ...css.configs['flat/recommended'],
    name: '(Vue - CSS) Extended config from plugin',
    files: [...vueFiles]
  },
  {
    name: '(Vue) Custom config',
    files: vueFiles,
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false
        }
      ],
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
      }],
      'vue/html-closing-bracket-newline': ['error', { multiline: 'never' }],
      'vue/block-order': ['error', {
        order: ['template', 'script:not([setup])', 'script[setup]']
      }],
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/return-in-computed-property': 'off'
    }
  },
  {
    /* First index is just the plugin definition */
    ...jsoncRecommended.at(0),
    ...jsoncRecommended.at(1),
    name: '(JSON) Custom config',
    rules: {
      ...jsoncRecommended.at(1).rules,
      ...jsoncRecommended.at(2).rules,
      'jsonc/auto': 'error',
      '@stylistic/quotes': ['error', 'double'],
      '@stylistic/semi': 'off',
      '@stylistic/quote-props': 'off'
    }
  },
  {
    /* First index is just the plugin definition */
    ...i18n.configs['flat/recommended'].at(0),
    /* Last contains the rule definitions */
    ...i18n.configs['flat/recommended'].at(-1),
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
  },
  /** Settings for all the files that run in development */
  {
    name: 'Environment config - Node.js and development-related files',
    files: ['*.config.*', 'scripts/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.nodeBuiltin
      }
    },
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true
        }
      ],
      'import-x/no-nodejs-modules': 'off'
    }
  },
  /** Settings for WebWorkers (the pattern matches any file that ends in .worker.ts) */
  {
    name: 'Environment config - WebWorkers',
    files: ['**/*.worker.ts'],
    languageOptions: {
      globals: {
        ...globals.worker
      }
    }
  },
  {
    ...stylistic.configs['disable-legacy'],
    name: 'Environment config - Disable legacy rules'
  },
  /**
   * Extra files to include and ignores that should override all the others
   */
  {
    name: 'Environment config - Ignored files',
    ignores: [
      '**/.git',
      'types/global/routes.d.ts',
      'types/global/components.d.ts',
      ...gitignore().ignores
    ]
  },
  /** File progress plugin */
  {
    name: '(eslint) Linting progress report',
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
);
