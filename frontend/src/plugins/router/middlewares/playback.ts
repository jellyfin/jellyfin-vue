import { isNil } from 'lodash-es';
import { RouteLocationNormalized, RouteLocationRaw } from 'vue-router/auto';
import { playbackManagerStore } from '@/store';

/**
 * Validates that no playback is happening when accesing a route
 */
export default function playbackGuard(
  to: RouteLocationNormalized
): boolean | RouteLocationRaw {
  const playbackManager = playbackManagerStore();

  if (to.path.includes('playback') && isNil(playbackManager.currentItem)) {
    return { path: '/', replace: true };
  }

  return true;
}
