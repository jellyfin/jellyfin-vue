import { createPinia } from 'pinia';
import { createApp } from 'vue';
/**
 * Main imports
 */
import Root from '@/App.vue';
import router from '@/plugins/vue/router';
import i18n from '@/plugins/vue/i18n';
import { vuetify } from '@/plugins/vue/vuetify';
import { hideDirective } from '@/plugins/vue/directives';
import piniaPlugins from '@/plugins/store';
import axiosInstance from '@/plugins/axios';
/**
 * CSS Imports
 */
import '@/assets/styles/global.scss';
import '@/assets/styles/transitions.scss';
import '@/assets/styles/variables.scss';

/**
 * Pinia
 */
const pinia = createPinia();

pinia.use(piniaPlugins);

/**
 * App initialization
 */
const app = createApp(Root);

app.use(i18n);
app.use(router);
app.use(pinia);
app.use(vuetify);

/**
 * Vue directives
 */
app.directive('hide', hideDirective);

app.mount('#app');
