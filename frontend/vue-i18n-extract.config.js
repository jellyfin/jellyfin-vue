export default {
  /*
   * https://github.com/Spittal/vue-i18n-extract
  /* 
    Required (Glob files pattern)
    Do not include the entire src directory because vue-i18n-extract doesn't have a way to exclude directories
   */
  vueFiles: './src/{pages,layouts,components}/**/*.vue',
  languageFiles: './locales/*.json',
  output: false,
  add: false,
  remove: false,
  ci: true
};
