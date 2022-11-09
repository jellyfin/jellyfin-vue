// eslint-disable-next-line @typescript-eslint/no-var-requires -- The ESLint config expects Node modules
var restrictedGlobals = require('confusing-browser-globals');

module.exports = {
  root: false,
  env: {
    node: false,
    browser: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  // Ignore test files for now
  ignorePatterns: ['*.spec.ts', '.eslintrc.js', '*.config.js'],
  extends: [
    'eslint:recommended',
    'plugin:json/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:promise/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:vue/vue3-recommended',
    'plugin:sonarjs/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:css/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: [
    'jsdoc',
    'json',
    '@typescript-eslint',
    'promise',
    'import',
    'vue',
    'lodash',
    'prettier',
    'sonarjs',
    'eslint-comments',
    'css',
    'file-progress'
  ],
  rules: {
    'file-progress/activate': 1,
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    'import/newline-after-import': 'error',
    'import/order': 'error',
    'import/no-unresolved': ['error', { ignore: ['virtual:*'] }],
    'jsdoc/require-hyphen-before-param-description': 'error',
    'jsdoc/require-description': 'error',
    'jsdoc/no-types': 'error',
    'jsdoc/require-jsdoc': 'error',
    'promise/no-nesting': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    'prefer-arrow-callback': 'error',
    'padding-line-between-statements': [
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
    'lodash/import-scope': ['error', 'method'],
    // Force some component order stuff, formatting and such, for consistency
    curly: ['error', 'all'],
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      {
        ignores: []
      }
    ],
    'vue/order-in-components': 'error',
    'vue/v-bind-style': 'error',
    'vue/v-on-style': 'error',
    'vue/v-slot-style': 'error',
    'vue/attributes-order': 'error',
    'vue/no-unused-refs': 'error',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always'
        }
      }
    ],
    'vue/html-closing-bracket-newline': ['error', { multiline: 'never' }],
    'vue/multiline-html-element-content-newline': 'error',
    'vue/multi-word-component-names': 'off',
    'eslint-comments/no-unused-disable': 'error'
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true
    },
    settings: {
      progress: {
        hide: false,
        successMessage: 'Linting done!'
      }
    }
  }
};
