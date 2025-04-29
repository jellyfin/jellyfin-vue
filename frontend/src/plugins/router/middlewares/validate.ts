import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import { isStr } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { useSnackbar } from '#/composables/use-snackbar';

/**
 * Validates that the route has a correct itemId parameter by checking that the parameter is a valid
 * MD5 hash.
 */
export function validateGuard(
  to: RouteLocationNormalized
): NavigationGuardReturn {
  if (('itemId' in to.params) && isStr(to.params.itemId)) {
    const check = /[\da-f]{32}/i.test(to.params.itemId);

    if (!check) {
      useSnackbar(i18next.t('routeValidationError'), 'error');

      return false;
    }
  }
}
