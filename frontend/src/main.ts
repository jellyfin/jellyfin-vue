import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Root from '@/App.vue';
import router from '@/plugins/vue/router';
import i18n from '@/plugins/vue/i18n';
import { vuetify } from '@/plugins/vue/vuetify';
import { hideDirective } from '@/plugins/vue/directives';
import piniaPlugins from '@/plugins/store';
import { createRemote } from '@/plugins/vue/remote';
import { createJSONConfig } from '@/plugins/vue/config';
/**
 * CSS Imports
 */
import '@/assets/styles/global.scss';
import '@/assets/styles/transitions.scss';
import '@/assets/styles/variables.scss';

const app = createApp(Root);
const pinia = createPinia();
const remote = createRemote();
const config = createJSONConfig();

/**
 * The order of statements IS IMPORTANT
 */
app.use(i18n);
app.use(router);
app.use(remote);
pinia.use(piniaPlugins);
app.use(pinia);
app.use(config);
app.use(vuetify);

/**
 * Vue directives
 */
app.directive('hide', hideDirective);

/**
 * Top-level await requires ES2022 as target and module for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */

await router.isReady();
app.mount('#app');

/**
 * Once we reach this point, the bundle will be completely loaded,
 * so we can fire a fade out transition and mount the app when that transition ends to give a nice effect
 */
const splashDOM = document.querySelector('.splashBackground');

splashDOM?.addEventListener(
  'transitionend',
  () => {
    splashDOM.remove();
  },
  { once: true }
);

splashDOM?.classList.add('loadFinished');
