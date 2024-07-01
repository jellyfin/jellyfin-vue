import type {
  RouteLocationNormalized,
  RouteLocationPathRaw,
  RouteLocationRaw
} from 'vue-router';
import { until } from '@vueuse/core';
import { remote } from '@/plugins/remote';
import { isNil } from '@/utils/validation';
import { getJSONConfig } from '@/utils/external-config';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const routes = new Set([serverAddUrl, serverSelectUrl, serverLoginUrl]);

/**
 * Redirects to login page if there's no user logged in.
 */
export async function loginGuard(
  to: RouteLocationNormalized
): Promise<boolean | RouteLocationRaw> {
  let destinationRoute: RouteLocationPathRaw | undefined;
  const jsonConfig = await getJSONConfig();

  if (!isNil(remote.auth.currentServer) && !isNil(remote.auth.currentUser) && !isNil(remote.auth.currentUserToken) && routes.has(to.path)) {
    destinationRoute = { path: '/', replace: true };
  }

  if (remote.auth.servers.length <= 0 && jsonConfig.defaultServerURLs.length <= 0) {
    destinationRoute = { path: serverAddUrl, replace: true };
  } else if (!routes.has(to.path)) {
    if (isNil(remote.auth.currentServer)) {
      if (jsonConfig.allowServerSelection) {
        destinationRoute = { path: serverSelectUrl, replace: true };
      } else {
        await until(() => remote.auth.currentServer).toBeTruthy({ flush: 'pre' });

        return loginGuard(to);
      }
    } else if (isNil(remote.auth.currentUser)) {
      destinationRoute = { path: serverLoginUrl, replace: true };
    }
  }

  return destinationRoute && to.path !== destinationRoute.path
    ? destinationRoute
    : true;
}
