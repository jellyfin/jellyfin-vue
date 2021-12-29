module.exports = {
  syntax: 'scss',
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
    'stylelint-config-recommended-vue'
  ],
  customSyntax: 'postcss-html',
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules: {
    'at-rule-no-unknown': null,
    'selector-class-pattern': null,
    // Firefox does not support the modern syntax. TODO: Revisit at some point
    'color-function-notation': 'legacy'
  }
};
