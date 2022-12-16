import { createApp } from 'vue';
import { OverlayScrollbars, ClickScrollPlugin } from 'overlayscrollbars';
import Root from '@/App.vue';
/* eslint-disable no-restricted-imports */
import {
  createRemote,
  createJSONConfig,
  pinia,
  i18n,
  router,
  vuetify
} from '@/plugins/vue';
import { hideDirective } from '@/plugins/vue/directives';
/* eslint-enable no-restricted-imports */

/**
 * CSS Imports
 */
import '@/assets/styles/global.scss';
import '@/assets/styles/transitions.scss';
import 'overlayscrollbars/overlayscrollbars.css';

const app = createApp(Root);
const remote = createRemote();
const config = createJSONConfig();

/**
 * The order of statements IS IMPORTANT
 */
app.use(i18n);
app.use(router);
app.use(remote);
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
OverlayScrollbars.plugin(ClickScrollPlugin);

const appElement = document.querySelector('#app') as HTMLDivElement;

OverlayScrollbars(document.querySelector('body') as HTMLElement, {
  update: {
    debounce: 0
  },
  scrollbars: {
    autoHide: 'move',
    autoHideDelay: 1000,
    clickScroll: true
  }
});

/**
 * This ensures the transition plays: https://router.vuejs.org/guide/migration/#all-navigations-are-now-always-asynchronous
 * Also ensures Suspense component's content has loaded on first navigation (refer to RouterViewTransition component)
 */
await router.isReady();

window.requestIdleCallback(() => {
  app.mount(appElement);
});

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

window.requestAnimationFrame(() => {
  splashDOM?.classList.add('loadFinished');
});
