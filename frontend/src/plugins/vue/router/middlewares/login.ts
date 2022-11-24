import isNil from 'lodash/isNil';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { useRemote } from '@/composables';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const routes = new Set([serverAddUrl, serverSelectUrl, serverLoginUrl]);

/**
 * Redirects to login page if there's no user logged in.
 */
export default function loginGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): boolean | RouteLocationRaw {
  const remote = useRemote();

  if (!routes.has(to.fullPath)) {
    if (remote.auth.servers.value.length <= 0) {
      return { path: serverAddUrl, replace: true };
    } else if (isNil(remote.auth.currentServer.value)) {
      return { path: serverSelectUrl, replace: true };
    } else if (isNil(remote.auth.currentUser.value)) {
      return { path: serverLoginUrl, replace: true };
    }
  }

  return true;
}
