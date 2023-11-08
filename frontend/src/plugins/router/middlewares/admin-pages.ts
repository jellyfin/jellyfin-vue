import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router/auto';
import { useRemote, useSnackbar, usei18n } from '@/composables';

/**
 * Redirect the user to index page when attempting to access
 * an admin page in settings.
 */
export default function adminGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  const remote = useRemote();
  const { t } = usei18n();

  if (to.meta.admin && !remote.auth.currentUser?.Policy?.IsAdministrator) {
    useSnackbar(t('errors.unauthorized'), 'error');

    return { path: '/', replace: true };
  }

  return true;
}
