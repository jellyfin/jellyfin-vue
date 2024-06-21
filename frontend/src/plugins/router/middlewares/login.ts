import type {
  RouteLocationNormalized,
  RouteLocationPathRaw,
  RouteLocationRaw
} from 'vue-router';
import { effectScope } from 'vue';
import { watchImmediate } from '@vueuse/core';
import { remote } from '@/plugins/remote';
import { isNil } from '@/utils/validation';
import { getJSONConfig } from '@/utils/external-config';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const routes = new Set([serverAddUrl, serverSelectUrl, serverLoginUrl]);

/**
 * Waits for a server connection to be established for cases where there are default servers
 * defined and the server selection screen is disallowed.
 */
async function ensureServer(): Promise<void> {
  const scope = effectScope();

  await new Promise<void>((resolve) => {
    scope.run(() => {
      watchImmediate(() => remote.auth.currentServer, () => {
        if (remote.auth.currentServer) {
          resolve();
        }
      });
    });
  });
  scope.stop();
}

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
        await ensureServer();

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
