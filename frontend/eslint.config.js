import jsdoc from 'eslint-plugin-jsdoc';
import unicorn from 'eslint-plugin-unicorn';
import eslintImport from 'eslint-plugin-import';
import fileProgress from 'eslint-plugin-file-progress';
import js from '@eslint/js';
import globals from 'globals';
import vueScopedCSS from 'eslint-plugin-vue-scoped-css';
import vue from 'eslint-plugin-vue';
import { FlatCompat } from '@eslint/eslintrc';
import gitignore from 'eslint-config-flat-gitignore';
import stylistic from '@stylistic/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import jsonc from 'eslint-plugin-jsonc';

const vueAndTsFiles = ['*.vue', '**/*.vue', '*.ts', '**/*.ts'];
const vueFiles = ['*.vue', '**/*.vue'];
const CI_environment = process.env.CI ? 0 : 1;

/**
 * TODO: Can be removed once all ESLint plugins are updated to support Flat config
 */
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const flatArrayOfObjects = obj => Object.assign({}, ...obj);

export default tseslint.config(
  /** Global settings */
  js.configs.recommended,
  unicorn.configs['flat/recommended'],
  stylistic.configs.customize({
    quotes: 'single',
    semi: true,
    commaDangle: 'never',
    braceStyle: '1tbs',
    arrowParens: false,
    blockSpacing: true
  }),
  /** File progress plugin */
  {
    name: 'Progress reporting',
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
  },
  {
    name: 'Common settings',
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    },
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
      'unicorn/explicit-length-check': 'off'
    }
  },
  /** Common TypeScript rules */
  {
    name: 'Parser config for TypeScript & Vue SFC files',
    files: vueAndTsFiles,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    ...flatArrayOfObjects(tseslint.configs.strictTypeChecked),
    name: '(typescript-eslint) Extended strict type checking rules',
    files: vueAndTsFiles
  },
  {
    ...flatArrayOfObjects(tseslint.configs.stylisticTypeChecked),
    name: '(typescript-eslint) Extended stylistic type checked rules',
    files: vueAndTsFiles
  },
  {
    ...tseslint.configs.eslintRecommended,
    files: vueAndTsFiles,
    name: '(typescript-eslint) Extended ESLint recommended rules for typechecking'
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:optimize-regex/recommended')),
    name: '(optimize-regex) Extended rules',
    files: vueAndTsFiles
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:you-dont-need-lodash-underscore/all')),
    name: '(you-dont-need-lodash) Extended rules',
    files: vueAndTsFiles
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:promise/recommended')),
    name: '(promise) Extended rules',
    files: vueAndTsFiles
  },
  {
    name: '(promise) Custom rule configs',
    files: vueAndTsFiles,
    rules: {
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error'
    }
  },
  {
    name: '(import) Custom rule configs',
    files: vueAndTsFiles,
    plugins: {
      import: eslintImport
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['*.config.ts', 'scripts/**/*.ts'],
          optionalDependencies: false,
          peerDependencies: false,
          bundledDependencies: false
        }
      ],
      'import/order': 'error',
      'import/no-cycle': 'error',
      'import/no-nodejs-modules': 'error',
      'import/no-duplicates': ['error', { 'prefer-inline': true, 'considerQueryString': true }],
      // From the recommended preset
      'import/named': 'error',
      'import/export': 'error'
    }
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:@intlify/vue-i18n/recommended')),
    name: '(@intlify/vue-i18n) Extended rules',
    files: vueAndTsFiles,
    settings: {
      'vue-i18n': {
        localeDir: 'locales/en.json',
        messageSyntaxVersion: '^9.0.0'
      }
    }
  },
  {
    name: '(@intlify/vue-i18n) Custom rule configs',
    files: vueAndTsFiles,
    rules: {
      '@intlify/vue-i18n/no-unused-keys': ['error', {
        extensions: ['.ts', '.vue'],
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
  {
    files: vueAndTsFiles,
    name: '(JSDoc) Custom rule configs',
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
    name: 'Custom config for TypeScript and Vue SFC settings',
    files: vueAndTsFiles,
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  {
    ...sonarjs.configs.recommended,
    name: 'SonarCloud recommended rules',
    files: vueAndTsFiles
  },
  /** SFC rules */
  {
    ...flatArrayOfObjects(vue.configs['flat/recommended']),
    name: 'Base config for Vue SFC files',
    files: vueFiles
  },
  {
    ...flatArrayOfObjects(vueScopedCSS.configs['flat/recommended']),
    name: 'Base config for Vue SFC files (Scoped CSS)',
    files: vueFiles
  },
  {
    ...flatArrayOfObjects(compat.extends('plugin:css/recommended')),
    name: 'Base config for Vue SFC files (Scoped CSS - eslint-plugin-css)',
    files: vueFiles
  },
  {
    name: 'Custom config for Vue SFC files',
    files: vueFiles,
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
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
      'vue/html-self-closing': 'error',
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
      }],
      'vue/html-closing-bracket-newline': ['error', { multiline: 'never' }],
      'vue/multiline-html-element-content-newline': 'error',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    ...flatArrayOfObjects(jsonc.configs['flat/recommended-with-json']),
    name: 'Base config for JSON files',
    files: ['*.json', '**/*.json']
  },
  {
    name: 'Custom config for JSON files',
    files: ['*.json', '**/*.json'],
    rules: {
      'jsonc/auto': 'error',
      '@stylistic/quotes': ['error', 'double'],
      '@stylistic/semi': 'off',
      '@stylistic/quote-props': 'off'
    }
  },
  /** Settings for all the files that run in development */
  {
    name: 'Development-related files',
    files: ['*.config.*', 'scripts/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.nodeBuiltin
      }
    },
    rules: {
      'import/no-nodejs-modules': 'off'
    }
  },
  /** Settings for WebWorkers (the pattern matches any file that includes the word 'worker', regardless it's capitalization) */
  {
    name: 'Environment config for WebWorker files',
    files: ['**/*[Ww][Oo][Rr][Kk][Ee][Rr]*.ts'],
    languageOptions: {
      globals: {
        ...globals.worker
      }
    }
  },
  /**
   * See the following:
   * - https://en.wikipedia.org/wiki/History_of_sentence_spacing#French_and_English_spacing
   * - https://docs.weblate.org/en/weblate-4.14.1/user/checks.html#check-punctuation-spacing
   */
  {
    name: '(i18n - French) Punctuation spacing rules exceptions',
    files: ['locales/fr.json'],
    rules: {
      'no-irregular-whitespace': 'off'
    }
  },
  {
    ...stylistic.configs['disable-legacy'],
    name: 'Disable legacy rules'
  },
  /**
   * Extra files to include and ignores that should override all the others
   */
  {
    name: 'Ignored files',
    ignores: [
      'types/global/routes.d.ts',
      'types/global/components.d.ts',
      ...gitignore().ignores
    ]
  }
);
