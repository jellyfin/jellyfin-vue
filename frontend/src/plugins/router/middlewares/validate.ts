import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';
import { isStr } from '@/utils/validation';

/**
 * Validates that the route has a correct itemId parameter by checking that the parameter is a valid
 * MD5 hash.
 */
export function validateGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  if (('itemId' in to.params) && isStr(to.params.itemId)) {
    const check = /[\da-f]{32}/i.test(to.params.itemId);

    if (!check) {
      useSnackbar(i18n.t('routeValidationError'), 'error');

      return { path: '/', replace: true };
    }
  }

  return true;
}
