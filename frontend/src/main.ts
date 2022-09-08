import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';
/**
 * Main imports
 */
import App from '@/App.vue';
import router from '@/plugins/vue/router';
import {
  messages,
  DEFAULT_LANGUAGE,
  BROWSER_LANGUAGE
} from '@/plugins/vue/i18n';
import vuetify from '@/plugins/vue/vuetify';
import piniaPlugins from '@/plugins/store';
import axiosInstance from '@/plugins/axios';
import Vuetify from 'vuetify/lib';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
/**
 * Component imports
 */
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import draggable from 'vuedraggable';
// @ts-expect-error - target typing doesn't exist as we declared it in params.
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import VueAwesomeSwiper from 'vue-awesome-swiper';
import 'swiper/css/swiper.css';
/**
 * CSS Imports
 */
import '@/assets/styles/global.scss';
import '@/assets/styles/transitions.scss';

/**
 * Pinia
 */
const pinia = createPinia();

pinia.use(piniaPlugins);

/**
 * Vue global config
 */
Vue.config.performance = true;

/**
 * Vue.use statements
 *
 * TODO: This can be removed in Vue 3. We need to merge all these statements in this file because if we don't do this, we're creating multiple
 * Vue instances.
 */
Vue.use(Vuetify);
Vue.use(PiniaVuePlugin);
Vue.use(VueRouter);
Vue.use(VueI18n);
// Components
Vue.use(VueAwesomeSwiper);
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.component('Draggable', draggable);
Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);

const i18n = new VueI18n({
  locale: Object.keys(messages).includes(BROWSER_LANGUAGE)
    ? BROWSER_LANGUAGE
    : DEFAULT_LANGUAGE,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages
});

/**
 * Vue directives
 */

// Toggles the CSS 'visibility' property of an element.
Vue.directive('hide', (el, binding) => {
  if (el) {
    if (binding.value === true) {
      el.style.visibility = 'hidden';
    } else {
      el.style.visibility = 'visible';
    }
  }
});

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
Vue.prototype.$axios = axiosInstance;
app.$mount('#app');
