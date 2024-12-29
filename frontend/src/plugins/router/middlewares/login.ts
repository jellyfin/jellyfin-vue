import type {
  NavigationGuardReturn,
  RouteLocationNormalized
} from 'vue-router';
import type { RouteNamedMap } from 'vue-router/auto-routes';
import { until } from '@vueuse/core';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';
import { jsonConfig } from '#/utils/external-config';
import { useSnackbar } from '#/composables/use-snackbar';
import { i18n } from '#/plugins/i18n';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const serverWizard = '/wizard';
const serverPages = new Set<keyof RouteNamedMap>([serverAddUrl, serverSelectUrl, serverLoginUrl, serverWizard]);

/**
 * Gets the best server page based on the current state.
 * Note that the final page rendered might differ from the best one here
 * in the loginGuard
 */
async function _getBestServerPage(): Promise<Nullish<keyof RouteNamedMap>> {
  if (jsonConfig.defaultServerURLs.length && isNil(remote.auth.currentServer.value)) {
    await until(remote.auth.currentServer).toBeTruthy({ flush: 'pre' });
  }

  if (!remote.auth.addedServers.value) {
    return serverAddUrl;
  } else if (isNil(remote.auth.currentServer.value)) {
    return serverSelectUrl;
  } else if (!remote.auth.currentServer.value.StartupWizardCompleted) {
    return serverWizard;
  }
}

export const loginGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<Exclude<NavigationGuardReturn, Error>> => {
  const toServerPages = serverPages.has(to.name);

  /**
   * Do not allow the server selection pages if `allowServerSelection` is false in config.json,
   * but do allow the login page.
   */
  if (!jsonConfig.allowServerSelection && (toServerPages && to.name !== serverLoginUrl)) {
    return false;
  }

  const fromServerPages = serverPages.has(from.name);
  const res = await _getBestServerPage();

  const loggedIn = !isNil(remote.auth.currentUser.value);
  const shouldBlockToServer = loggedIn && toServerPages;
  const shouldBlockToApp = !loggedIn && !toServerPages;
  const shouldBlock = shouldBlockToServer || shouldBlockToApp;
  const shouldRedirectToHome = loggedIn && fromServerPages;
  /**
   * Redirections between server and app pages are freely allowed
   */
  const shouldRedirect = !isNil(res) || shouldBlockToApp || shouldRedirectToHome;

  if (shouldRedirect) {
    const name = loggedIn ? '/' : res ?? serverLoginUrl;

    if (to.name !== name) {
      return {
        name,
        replace: true
      };
    }
  } else if (shouldBlock) {
    useSnackbar(i18n.t('unauthorized'), 'error');

    return false;
  }
};
