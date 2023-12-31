/**
 * Top-level await requires ES2022 (at least) as target and module
 * for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */

import Root from '@/App.vue';
import { hideDirective } from '@/plugins/directives';
import { vuePlugin as i18n } from '@/plugins/i18n';
import { createPlugin as createRemote } from '@/plugins/remote';
import { router } from '@/plugins/router';
import { vuetify } from '@/plugins/vuetify';
import { createApp } from 'vue';

/**
 * - GLOBAL STYLES -
 */
import '@/assets/styles/global.scss';
import '@fontsource/roboto';

/**
 * - VUE PLUGINS, STORE AND DIRECTIVE -
 * The order of statements IS IMPORTANT
 */
/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
const app = createApp(Root);
const remote = createRemote();

app.use(remote);
app.use(i18n);
app.use(router);
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
 *
 * Once we reach this point, the bundle and the app will be completely loaded and mounted,
 * so we add a loadFinished class (defined in index.html) that fires the defined transition
 * in the HTML markup to give a nice effect.
 */
window.setTimeout(() => {
  window.requestAnimationFrame(() => {
    const appDOM = document.querySelector('#app');
    const splashDOM = document.querySelector('.splashBackground');

    if (!appDOM || !splashDOM) {
      throw new Error('could not locate app div or splash div in DOM');
    }

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
