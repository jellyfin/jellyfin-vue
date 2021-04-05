import Vue from 'vue';

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const VueAxe = require('vue-axe').default;

  Vue.use(VueAxe, { auto: false, clearConsoleOnUpdate: false });
}
