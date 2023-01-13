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
import { getJSONConfig } from '@/utils/external-config';
import { useRemote } from '@/composables';

const router = createRouter({
  history:
    (await getJSONConfig()).historyMode === 'history'
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
  const title = router.currentRoute.value.meta.title?.trim();

  return title ? `${title} | Jellyfin Vue` : 'Jellyfin Vue';
});

useTitle(pageTitle);

/**
 * Re-run the middleware pipeline when the user logs out
 */
const remote = useRemote();

watch([remote.auth.currentUser, remote.auth.servers], () => {
  if (!remote.auth.currentUser.value || remote.auth.servers.value.length <= 0) {
    /**
     * We run the redirect to /server/add as it's the first page in the login flow
     *
     * In case the whole localStorage is gone at runtime, if we're at the login
     * page, redirecting to /server/login wouldn't work, as we're in that same page.
     * /server/add doesn't depend on the state of localStorage, so it's always safe to
     * redirect there and leave the middleware take care of the final destination
     * (when servers are already available, for example)
     */
    router.replace('/server/add');
  }
});

export default router;
