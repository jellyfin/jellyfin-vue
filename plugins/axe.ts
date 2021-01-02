import Vue from 'vue';

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line
  import('vue-axe').then(({ default: VueAxe }) => {
    Vue.use(VueAxe);
  });
}
