/**
 * This file will be here for a while while we get accostumed to ESLint v9.
 * The running ESLint configuration is currently at eslint.config.js
 *
 * The rules here have not been migrated to the new flat config format, and
 * here are some reasons why.
 *
 * Lots of the rules were not defined in the flat config file because they were
 * already using the default values (tested using ESLint Config Inspector).
 */

module.exports = {
  rules: {
    // Only that option was different from the default values
    '@stylistic/indent': ['error', 2, {
      VariableDeclarator: 2
    }],
    /**
     * This rule got quite annoying. Let's see how it goes with TypeScript typechecking
     * and the recommended stylistic rules
     */
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
    // This rule is annoying when commenting code pieces
    'capitalized-comments': [
      'error', 'always',
      {
        ignoreInlineComments: true,
        ignoreConsecutiveComments: true
      }],
    // This rule should be enforced by properly setting the env var in the flat config file.
    'no-restricted-globals': ['error', ...restrictedGlobals],
    // Import plugin is still not working with ESLint v9
    'import/newline-after-import': 'error',
    // It's better to use TypeScript for this, since it leverages the real bundler environment
    'import/no-unresolved': 'off',
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
    // Promise plugin is still not working with ESLint v9
    'promise/no-nesting': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    // This rule made sense in Options API, but atm is really verbose
    '@typescript-eslint/explicit-function-return-type': 'error'
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
    // This parser configuration doesn't work correctly in ESLint v9
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
    // import plugin is still not working with ESLint v9
    {
      files: ['vite.config.ts', 'scripts/**/*.ts'],
      rules: {
        'import/no-nodejs-modules': 'off'
      }
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
    }
  }
};
