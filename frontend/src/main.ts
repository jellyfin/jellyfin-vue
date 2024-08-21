/**
 * Top-level await requires ES2022 (at least) as target and module
 * for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */
import { createApp } from 'vue';
import { routes } from 'vue-router/auto-routes';
import { getFontFaces } from '@/utils/data-manipulation';
import Root from '@/App.vue';
import { hideDirective } from '@/plugins/directives';
import { vuePlugin as i18n } from '@/plugins/i18n';
import { createPlugin as createRemote } from '@/plugins/remote';
import { router } from '@/plugins/router';
import { vuetify } from '@/plugins/vuetify';
/**
 * - GLOBAL STYLES -
 */
import 'uno.css';
import 'virtual:unocss-devtools';
import '@/assets/styles/index.css';

/**
 * - VUE PLUGINS, STORE AND DIRECTIVE -
 * The order of statements IS IMPORTANT
 */
const remote = createRemote();
const app = createApp(Root);

/**
 * We add routes at this point instead of in the router plugin to avoid circular references
 * in components. At this stage, we're sure plugins are instantiated.
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
 * Ensure everything is fully loaded before mounting the app
 */
await Promise.all([
  router.isReady(),
  ...getFontFaces().map(font => font.load())
]);
await document.fonts.ready;

/**
 * MOUNTING POINT
 */
app.mount(document.body);
