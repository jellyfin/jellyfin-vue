import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router/auto';
import { useSnackbar } from '@/components/System/Snackbar.vue';
import { usei18n } from '@/composables';
import { isValidMD5 } from '@/utils/items';

/**
 * Validates that the route has a correct itemId parameter
 */
export default function validateGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  if (to.params.itemId && typeof to.params.itemId === 'string') {
    const { t } = usei18n();
    const check = isValidMD5(to.params.itemId);

    if (!check) {
      useSnackbar(t('snackbar.routeValidationError'), 'error');

      return { path: '/', replace: true };
    }
  }

  return true;
}
