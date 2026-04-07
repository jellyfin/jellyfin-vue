import type { NavigationGuardReturn } from 'vue-router';
import { isNil } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { playbackManager } from '#/store/playback-manager';
import { useSnackbar } from '#/composables/use-snackbar';

/**
 * Validates that no playback is happening when accesing a route
 */
export function playbackGuard(): NavigationGuardReturn {
  if (isNil(playbackManager.currentItem.value)) {
    useSnackbar(i18next.t('routeValidationError'), 'error');

    return false;
  }
}
