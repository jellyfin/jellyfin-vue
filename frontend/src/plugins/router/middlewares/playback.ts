import { playbackManager } from '@/store/playbackManager';
import { isNil } from 'lodash-es';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router/auto';

/**
 * Validates that no playback is happening when accesing a route
 */
export default function playbackGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  if (to.path.includes('playback') && isNil(playbackManager.currentItem)) {
    return { path: '/', replace: true };
  }

  return true;
}
