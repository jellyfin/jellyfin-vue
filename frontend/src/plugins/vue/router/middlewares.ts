import { useRemote } from '@/composables';
import isNil from 'lodash/isNil';
import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationRaw
} from 'vue-router';

/**
 * loggedInIndex: Location to redirect when an user is logged in and access one of
 */

const notLoggedInRoutes = {
  serverAddUrl: '/server/add',
  serverSelectUrl: '/server/select',
  serverLoginUrl: '/server/login'
};
const authGuardRoutes = {
  serverAddUrl: '/server/add',
  serverSelectUrl: '/server/select',
  serverLoginUrl: '/server/login',
  loggedInIndex: '/',
  adminRedirect: '/'
};

/**
 * Redirects to login page if there's no user logged in
 */
export async function loginGuard(): Promise<boolean | RouteLocationRaw> {
  const remote = useRemote();

  if (remote.auth.servers.value.length <= 0) {
    return { name: '/server/add', replace: true };
  } else if (
    isNil(remote.auth.currentUser.value) &&
    !isNil(remote.auth.currentServer.value)
  ) {
    return { name: '/login', replace: true };
  }

  return true;
}
