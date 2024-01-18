import type {
  RouteLocationNormalized,
  RouteLocationPathRaw,
  RouteLocationRaw
} from 'vue-router/auto';
import { remote } from '@/plugins/remote';
import { isNil } from '@/utils/validation';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const routes = new Set([serverAddUrl, serverSelectUrl, serverLoginUrl]);

/**
 * Redirects to login page if there's no user logged in.
 */
export function loginGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  let destinationRoute: RouteLocationPathRaw | undefined;

  if (remote.auth.servers.length <= 0) {
    destinationRoute = { path: serverAddUrl, replace: true };
  } else if (!routes.has(to.path)) {
    if (isNil(remote.auth.currentServer)) {
      destinationRoute = { path: serverSelectUrl, replace: true };
    } else if (isNil(remote.auth.currentUser)) {
      destinationRoute = { path: serverLoginUrl, replace: true };
    }
  }

  return destinationRoute && to.path !== destinationRoute.path
    ? destinationRoute
    : true;
}
