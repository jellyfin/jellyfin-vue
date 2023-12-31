import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';
import { isValidMD5 } from '@/utils/items';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router/auto';

/**
 * Validates that the route has a correct itemId parameter
 */
export function validateGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  if (('itemId' in to.params) && typeof to.params.itemId === 'string') {
    const check = isValidMD5(to.params.itemId);

    if (!check) {
      useSnackbar(i18n.t('routeValidationError'), 'error');

      return { path: '/', replace: true };
    }
  }

  return true;
}
