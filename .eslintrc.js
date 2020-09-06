module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jsdoc/recommended',
    'plugin:@typescript-eslint/recommended',
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
    'plugin:nuxt/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  plugins: ['prettier', 'promise', 'import', 'jsdoc'],
  // add your custom rules here
  rules: {
    'import/newline-after-import': 'error',
    'import/order': 'error',
    'promise/no-nesting': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/prefer-await-to-callbacks': 'error',
    'promise/prefer-await-to-then': 'error',
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      {
        ignores: []
      }
    ]
  },
  settings: {
    'import/resolver': {
      nuxt: {
        extensions: ['.js', '.ts', '.vue', '.json']
      }
    }
  }
};
