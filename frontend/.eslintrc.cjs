const restrictedGlobals = require('confusing-browser-globals');

const CI_environment = process.env.CI ? 0 : 1;
const commonTSAndVueConfig = {
  extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
  rules: {
    // TODO: Investigate why this rule reports false positives
    '@typescript-eslint/no-misused-promises': 'off',
    'no-secrets/no-secrets': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/no-redundant-type-constituents': 'off'
  }
};

module.exports = {
  root: true,
  env: {
    node: false,
    browser: true
  },
  reportUnusedDisableDirectives: true,
  ignorePatterns: [
    'types/global/routes.d.ts',
    'types/global/components.d.ts'
  ],
  extends: [
    'eslint:recommended',
    'plugin:jsonc/recommended-with-json',
    'plugin:no-unsanitized/DOM',
    'plugin:optimize-regex/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:promise/recommended',
    'plugin:import/errors',
    'plugin:import/typescript',
    'plugin:vue/vue3-recommended',
    'plugin:sonarjs/recommended',
    'plugin:css/recommended',
    'plugin:unicorn/recommended',
    'plugin:you-dont-need-lodash-underscore/all',
    'plugin:@intlify/vue-i18n/recommended',
    'plugin:vue-scoped-css/vue3-recommended',
    'plugin:@stylistic/disable-legacy'
  ],
  plugins: [
    '@stylistic',
    'jsdoc',
    'jsonc',
    'no-unsanitized',
    'optimize-regex',
    'no-secrets',
    '@typescript-eslint',
    'promise',
    'import',
    'vue',
    'sonarjs',
    'css',
    'unicorn',
    'you-dont-need-lodash-underscore',
    'vue-scoped-css',
    '@intlify/vue-i18n',
    'file-progress'
  ],
  rules: {
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }],
    '@stylistic/comma-dangle': 'error',
    '@stylistic/indent': ['error', 2, {
      'SwitchCase': 1,
      'VariableDeclarator': 2,
      'CallExpression': { arguments: 'first' },
      'ArrayExpression': 'first',
      'ObjectExpression': 'first',
      'ImportDeclaration': 'first',
      flatTernaryExpressions: true,
      offsetTernaryExpressions: true
    }],
    '@stylistic/no-multi-spaces': ['error'],
    '@stylistic/block-spacing': ['error', 'always'],
    '@stylistic/linebreak-style': ['error', 'unix'],
    '@stylistic/brace-style': ['error'],
    '@stylistic/no-trailing-spaces': ['error'],
    '@stylistic/eol-last': ['error', 'always'],
    '@stylistic/padding-line-between-statements': [
      'error',
      // Always require blank lines after directives (like 'use-strict'), except between directives
      { blankLine: 'always', prev: 'directive', next: '*' },
      { blankLine: 'any', prev: 'directive', next: 'directive' },
      // Always require blank lines after import, except between imports
      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'any', prev: 'import', next: 'import' },
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
    ],
    '@stylistic/no-multiple-empty-lines': 'error',
    '@stylistic/indent-binary-ops': ['error', 2],
    '@stylistic/type-generic-spacing': 'error',
    '@stylistic/type-named-tuple-spacing': 'error',
    'no-extend-native': 'error',
    'file-progress/activate': CI_environment,
    'capitalized-comments': [
      'error', 'always',
      {
        'ignoreInlineComments': true,
        ignoreConsecutiveComments: true
      }],
    'multiline-comment-style': 'error',
    'unicode-bom': ['error', 'never'],
    'no-restricted-globals': ['error', ...restrictedGlobals],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'import/newline-after-import': 'error',
    // It's better to use TypeScript for this, since it leverages the real bundler environment
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['vite.config.ts', 'scripts/**/*.ts'],
        optionalDependencies: false,
        peerDependencies: false,
        bundledDependencies: false
      }
    ],
    'import/order': 'error',
    'import/no-cycle': 'error',
    'import/no-nodejs-modules': 'error',
    'import/no-duplicates': ['error', { 'prefer-inline' : true }],
    'jsdoc/require-hyphen-before-param-description': 'error',
    'jsdoc/require-description': 'error',
    'jsdoc/no-types': 'error',
    'jsdoc/require-jsdoc': 'error',
    'jsdoc/informative-docs': 'error',
    'promise/no-nesting': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': true,
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': true
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/no-import-type-side-effects': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', {
      'prefer': 'type-imports',
      'fixStyle': 'inline-type-imports'
    }],
    'prefer-arrow-callback': 'error',
    // Force some component order stuff, formatting and such, for consistency
    'curly': ['error', 'all'],
    'unicorn/filename-case': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-await-expression-member': 'off',
    // TODO: Reenable once vue-i18n-extract is completely refactored
    '@intlify/vue-i18n/no-unused-keys': ['error', {
      'extensions': ['.ts', '.vue'],
      enableFix: true
    }],
    '@intlify/vue-i18n/no-raw-text': ['error', {
      'ignorePattern': '^[-#:()&.]+$'
    }],
    '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
    '@intlify/vue-i18n/no-dynamic-keys': 'error',
    'vue/component-name-in-template-casing': [
      'error',
      'PascalCase',
      {
        registeredComponentsOnly: false
      }
    ],
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'always'
        }
      }
    ],
    'vue/define-macros-order': ['error', {
      order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
    }],
    'vue/html-closing-bracket-newline': ['error', { multiline: 'never' }],
    'vue/multiline-html-element-content-newline': 'error',
    'vue/multi-word-component-names': 'off',
    'vue/return-in-computed-property': 'off'
  },
  /**
   * Overrides allows us to omit the --ext CLI argument, simplifying package.json scripts section
   */
  overrides: [
    {
      files: ['*.md'],
      rules: {
        '@stylistic/no-trailing-spaces': ['off'],
        'no-secrets/no-secrets': 'error'
      }
    },
    {
      files: ['*.json'],
      parser: 'jsonc-eslint-parser',
      rules: {
        '@stylistic/quotes': ['error', 'double'],
        '@stylistic/semi': 'off',
        'jsonc/auto': 'error'
      }
    },
    /**
     * See the following:
     * - https://en.wikipedia.org/wiki/History_of_sentence_spacing#French_and_English_spacing
     * - https://docs.weblate.org/en/weblate-4.14.1/user/checks.html#check-punctuation-spacing
     */
    {
      files: ['locales/fr.json'],
      rules: {
        'no-irregular-whitespace': 'off'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: 'typescript-eslint-parser-for-extra-files',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
        project: 'tsconfig.json',
        extraFileExtensions: ['.vue']
      },
      ...commonTSAndVueConfig
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: 'typescript-eslint-parser-for-extra-files',
        project: 'tsconfig.json',
        sourceType: 'module'
      },
      ...commonTSAndVueConfig
    },
    // TODO: Review once ESLint config is ESM
    {
      files: ['.eslintrc.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off',
        'unicorn/prefer-module': 'off',
        'no-undef': 'off'
      }
    },
    {
      files: ['vite.config.ts', 'scripts/**/*.ts'],
      rules: {
        'import/no-nodejs-modules': 'off'
      }
    },
    {
      files: ['*.js']
    },
    {
      files: ['*.d.ts'],
      rules: {
        'multiline-comment-style': 'off'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: true,
      node: false
    },
    progress: {
      hide: false,
      successMessage: 'Linting done!'
    },
    'vue-i18n': {
      /**
       * We just want to do linting for en, weblate already handles removing unused and duplicated keys
       * in other locales based on en translations!
       *
       * This also allows us to speed up linting
       */
      localeDir: 'locales/en.json',
      messageSyntaxVersion: '^9.0.0'
    }
  }
};
