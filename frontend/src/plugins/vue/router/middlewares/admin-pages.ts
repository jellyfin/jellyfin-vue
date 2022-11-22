import { useI18n } from 'vue-i18n';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { useRemote, useSnackbar } from '@/composables';

const remote = useRemote();
const { t } = useI18n();
/**
 * Redirect the user to index page when attempting to access
 * an admin page in settings.
 */
export default function adminGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  if (to.meta.admin && remote.auth.currentUser.value?.Policy?.IsAdministrator) {
    useSnackbar(t('errors.unauthorized'), 'error');

    return { name: '/', replace: true };
  }

  return true;
}
