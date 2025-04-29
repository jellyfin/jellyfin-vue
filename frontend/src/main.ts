/**
 * Top-level await requires ES2022 (at least) as target and module
 * for TypeScript compiler (check tsconfig.json)
 * https://caniuse.com/mdn-javascript_operators_await_top_level
 */
import '@jellyfin-vue/i18n';
import { createApp } from 'vue';
import { routes } from 'vue-router/auto-routes';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { getFontFaces } from '#/utils/data-manipulation';
import { hideDirective } from '#/plugins/directives';
import { createPlugin as createRemote } from '#/plugins/remote';
import { router } from '#/plugins/router';
import { vuetify } from '#/plugins/vuetify';
import Root from '#/App.vue';
/**
 * - GLOBAL STYLES -
 */
import 'uno.css';
import '#/assets/styles/index.css';

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
app.use(I18NextVue, { i18next });
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
