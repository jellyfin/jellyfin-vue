import { computed } from 'vue';
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

export default router;
