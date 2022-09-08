import '@/assets/scss/app.scss';
import App from '@/App.vue';
import Vue from 'vue';
import '@/plugins/vue/components';
import '@/plugins/vue/directives';
import { createPinia, PiniaVuePlugin } from 'pinia';
import router from '@/plugins/vue/router';
import i18n from '@/plugins/vue/i18n';

/**
 * Pinia
 */
const pinia = createPinia();
Vue.use(PiniaVuePlugin);

/**
 * Vue global config
 */
Vue.config.performance = true;

/**
 * App initialization
 */
const app = new Vue({
  router,
  pinia,
  vuetify,
  i18n,
  render: (h) => h(App)
});

app.$mount('#app');
