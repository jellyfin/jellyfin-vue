import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';
import { remote } from '@/plugins/remote';

/**
 * Redirect the user to index page when attempting to access
 * an admin page in settings.
 */
export function adminGuard(
  to: RouteLocationNormalized
): NavigationGuardReturn {
  if (to.meta.admin && !remote.auth.currentUser?.Policy?.IsAdministrator) {
    useSnackbar(i18n.t('unauthorized'), 'error');

    return false;
  }
}
