import type { NavigationGuardReturn } from 'vue-router';
import { playbackManager } from '@/store/playback-manager';
import { isNil } from '@/utils/validation';
import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';

/**
 * Validates that no playback is happening when accesing a route
 */
export function playbackGuard(): NavigationGuardReturn {
  if (isNil(playbackManager.currentItem)) {
    useSnackbar(i18n.t('routeValidationError'), 'error');

    return false;
  }
}
