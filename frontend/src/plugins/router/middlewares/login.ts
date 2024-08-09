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
const serverRoutes = new Set([serverAddUrl, serverSelectUrl]);
const routes = new Set([...serverRoutes, serverLoginUrl]);

/**
 * Performs the login guard redirection ensuring no redirection loops happen
 */
function doRedir(dest: RouteLocationPathRaw, to: RouteLocationNormalized) {
  return to.path === dest.path
    ? true
    : dest;
}

/**
 * Redirects to login page if there's no user logged in.
 */
export async function loginGuard(
  to: RouteLocationNormalized
): Promise<boolean | RouteLocationRaw> {
  const jsonConfig = await getJSONConfig();

  if (jsonConfig.defaultServerURLs.length && isNil(remote.auth.currentServer)) {
    await until(() => remote.auth.currentServer).toBeTruthy({ flush: 'pre' });
  }

  if (
    (
      !jsonConfig.allowServerSelection
      && serverRoutes.has(to.path)
    )
    || (
      !isNil(remote.auth.currentServer)
      && !isNil(remote.auth.currentUser)
      && !isNil(remote.auth.currentUserToken)
      && routes.has(to.path)
    )
  ) {
    return doRedir({ path: '/', replace: true }, to);
  }

  if (!remote.auth.servers.length) {
    return doRedir({ path: serverAddUrl, replace: true }, to);
  } else if (isNil(remote.auth.currentServer)) {
    return doRedir({ path: serverSelectUrl, replace: true }, to);
  } else if (isNil(remote.auth.currentUser)) {
    return doRedir({ path: serverLoginUrl, replace: true }, to);
  }

  return true;
}
