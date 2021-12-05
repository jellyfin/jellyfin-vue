// eslint-disable-next-line @typescript-eslint/no-var-requires -- The ESLint config expects Node modules
var restrictedGlobals = require('confusing-browser-globals');

module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jsdoc/recommended',
    'plugin:json/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  plugins: ['prettier', 'promise', 'import', 'jsdoc', 'lodash'],
  rules: {
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    'import/newline-after-import': 'error',
    'import/order': 'error',
    'jsdoc/require-hyphen-before-param-description': 'error',
    'promise/no-nesting': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    'prefer-arrow-callback': 'error',
    curly: 'error',
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
    'lodash/import-scope': ['error', 'method']
  },
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.vue'],
      env: {
        browser: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        'plugin:jsdoc/recommended',
        'plugin:json/recommended',
        'plugin:@typescript-eslint/recommended',
        '@nuxtjs/eslint-config-typescript',
        'prettier',
        'plugin:prettier/recommended',
        'plugin:promise/recommended',
        'plugin:nuxt/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
      ],
      rules: {
        // Force some component order stuff, formatting and such, for consistency
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
        'vue/multiline-html-element-content-newline': 'error',
        'vue/multi-word-component-names': 'off',
        // This rule gives false positives with asyncData
        'vue/no-dupe-keys': 'off'
      },
      settings: {
        'import/resolver': {
          nuxt: {
            extensions: ['.js', '.ts', '.d.ts', '.vue', '.json'],
            nuxtSrcDir: 'src/'
          }
        }
      }
    },
    {
      files: ['**/*.spec.ts'],
      plugins: ['jest', 'jest-formatting'],
      env: {
        'jest/globals': true
      },
      extends: [
        'plugin:jest/recommended',
        'plugin:jest/style',
        'plugin:jest-formatting/strict'
      ],
      rules: {
        'jest/consistent-test-it': ['error']
      }
    }
  ]
};
