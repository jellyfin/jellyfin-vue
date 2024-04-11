/**
 * Top-level await requires ES2022 (at least) as target and module
 * for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */
/**
 * TODO: Move UnoCSS classes down (alongside our own stylesheets) when
 * Vuetify is removed. The order herer is important so Vuetify styles override
 * UnoCSS ones.
 */
import 'uno.css';
import 'virtual:unocss-devtools';
import { createApp } from 'vue';
import { routes } from 'vue-router/auto-routes';
import Root from '@/App.vue';
import { hideDirective } from '@/plugins/directives';
import { vuePlugin as i18n } from '@/plugins/i18n';
import { createPlugin as createRemote } from '@/plugins/remote';
import { router } from '@/plugins/router';
import { vuetify } from '@/plugins/vuetify';

/**
 * - GLOBAL STYLES -
 */
import 'inter-ui/inter-variable.css';
/* eslint-disable-next-line import/no-extraneous-dependencies */
import '@unocss/reset/tailwind-compat.css';
import '@/assets/styles/global.scss';

/**
 * - VUE PLUGINS, STORE AND DIRECTIVE -
 * The order of statements IS IMPORTANT
 */
const remote = createRemote();

const app = createApp(Root);

/**
 * We add routes at this point instead of in the router plugin to avoid circular references
 * in components. At this stage, we're sure plugins are initiated.
 *
 * TODO: Track https://github.com/posva/unplugin-vue-router/pull/157 for proper fix
 */
for (const route of routes) {
  router.addRoute(route);
}

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
 * MOUNTING POINT
 *
 * See how we remove the splashcreen on App.vue file
 */
window.requestAnimationFrame(() => {
  app.mount('#app');
});
