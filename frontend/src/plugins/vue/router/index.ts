import { computed, watch } from 'vue';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { useTitle } from '@vueuse/core';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import loginGuard from './middlewares/login';
import adminGuard from './middlewares/admin-pages';
import validateGuard from './middlewares/validate';
import metaGuard from './middlewares/meta';
import { useRemote } from '@/composables';

const router = createRouter({
  history: __HISTORY_ROUTER_MODE__
    ? createWebHistory()
    : createWebHashHistory(),
  routes: setupLayouts(generatedRoutes)
});

/**
 * Middlewares
 *  - The order IS IMPORTANT (meta handling should always go first)
 */
router.beforeEach(metaGuard);
router.beforeEach(loginGuard);
router.beforeEach(adminGuard);
router.beforeEach(validateGuard);

/**
 * Handle page title changes
 */
const pageTitle = computed(() => {
  return router.currentRoute.value.meta.title;
});

useTitle(pageTitle, {
  titleTemplate: '%s | Jellyfin Vue'
});

const remote = useRemote();

/**
 * Re-run the middleware pipeline when the user logs out
 */
watch(remote.auth.currentUser, () => {
  if (!remote.auth.currentUser.value) {
    router.go(0);
  }
});

export default router;
