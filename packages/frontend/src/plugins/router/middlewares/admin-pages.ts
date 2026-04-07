import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import i18next from 'i18next';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { remote } from '#/plugins/remote/index.ts';

/**
 * Redirect the user to index page when attempting to access
 * an admin page in settings.
 */
export function adminGuard(
  to: RouteLocationNormalized
): NavigationGuardReturn {
  if (to.meta.admin && !remote.auth.currentUser.value?.Policy?.IsAdministrator) {
    useSnackbar(i18next.t('unauthorized'), 'error');

    return false;
  }
}
