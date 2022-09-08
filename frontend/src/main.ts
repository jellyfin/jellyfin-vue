import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';
import App from '@/App.vue';
import '@/plugins/vue/components';
import '@/plugins/vue/directives';
import router from '@/plugins/vue/router';
import i18n from '@/plugins/vue/i18n';
import vuetify from '@/plugins/vue/vuetify';
import piniaPlugins from '@/plugins/store';
/**
 * CSS Imports
 *
 * Order of imports is relevant. Vuetify needs to be loaded first, so it's variables are available to the rest of SCSS files.
 */
import 'vuetify/src/styles/styles.sass';
//import '@/assets/global.scss';
import '@/assets/transitions.scss';

/**
 * Pinia
 */
const pinia = createPinia();
Vue.use(PiniaVuePlugin);
pinia.use(piniaPlugins);

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
