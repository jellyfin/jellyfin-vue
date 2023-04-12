/**
 * Top-level await requires ES2022 (at least) as target and module
 * for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */

import { createApp } from 'vue';
import Root from '@/App.vue';
/* eslint-disable no-restricted-imports */
import { createRemote, i18n, router, vuetify } from '@/plugins';
import { hideDirective } from '@/plugins/directives';
/* eslint-enable no-restricted-imports */

/**
 * - GLOBAL STYLES -
 */
import '@/assets/styles/global.scss';
import '@fontsource/roboto';

/**
 * - VUE PLUGINS, STORE AND DIRECTIVE -
 * The order of statements IS IMPORTANT
 */

const app = createApp(Root);
const remote = createRemote();

app.use(i18n);
app.use(router);
app.use(remote);
app.use(vuetify);
app.directive('hide', hideDirective);

/**
 * This ensures the transition plays: https://router.vuejs.org/guide/migration/#all-navigations-are-now-always-asynchronous
 * Also ensures Suspense component's content has loaded on first navigation (refer to RouterViewTransition component)
 */
await router.isReady();

/**
 * - DOM POPULATION -
 *
 * Without window.setTimeout and window.requestAnimationFrame, the
 * splash screen gets frozen an small (but noticeable) amount of time.
 */
const appDOM = document.querySelector('#app');
const splashDOM = document.querySelector('.splashBackground');

if (!appDOM || !splashDOM) {
  throw new Error('could not locate app div or splash div in DOM');
}

/**
 * Once we reach this point, the bundle and the app will be completely loaded and mounted,
 * so we add a loadFinished class (defined in index.html) that fires the defined transition
 * in the HTML markup to give a nice effect.
 */
window.setTimeout(() => {
  window.requestAnimationFrame(() => {
    splashDOM.addEventListener(
      'transitionend',
      () => {
        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            splashDOM.remove();
          });
        });
      },
      { once: true }
    );

    app.mount(appDOM);
    splashDOM.classList.add('loadFinished');
  });
});
