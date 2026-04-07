import { watch } from 'vue';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { isStr } from '@jellyfin-vue/shared/validation';
import { remote } from '../remote';
import { adminGuard } from './middlewares/admin-pages';
import { loginGuard } from './middlewares/login';
import { metaGuard } from './middlewares/meta';
import { validateGuard } from './middlewares/validate';
import { jsonConfig } from '#/utils/external-config';

export const router = createRouter({
  history:
    jsonConfig.routerMode === 'history'
      ? createWebHistory()
      : createWebHashHistory(),
  routes: [],
  /**
   * TODO: Fix this, so it only scrolls to the top once suspense resolves
   */
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  }
});

/**
 * Middleware pipeline: The order IS IMPORTANT (meta handling should always go last)
 *
 * Route-specific guards should be defined in the route itself, not here.
 */
router.beforeEach(loginGuard);
router.beforeEach(adminGuard);
router.beforeEach(validateGuard);
router.beforeEach(metaGuard);

/**
 * Replaces the 'back' function, taking into account if there's a previous page or not.
 * If there's no previous page in history, we ensure we want to go home
 */
const backTransition = 'slide-x';

router.back = () => {
  const route = router.currentRoute;

  /**
   * Play the default page transition but reversed, to play a different effect when going
   * to the previous page.
   */
  route.value.meta.layout.transition = {
    enter: 'slide-x-reverse',
    leave: route.value.meta.layout.transition.leave ?? backTransition
  };

  if (isStr(router.options.history.state.back)) {
    router.go(-1);
  } else {
    void router.replace('/');
  }
};

/**
 * Re-run the middleware pipeline when the user logs out or state is cleared,
 * no additional logic is here so we can keep the the login middleware
 * is the only source of truth.
 */
watch([
  remote.auth.currentUser,
  remote.auth.currentServer
], () => {
  void router.replace({
    ...router.currentRoute.value,
    force: true
  });
}, { flush: 'sync' });
