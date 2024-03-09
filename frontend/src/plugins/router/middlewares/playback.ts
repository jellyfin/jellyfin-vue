import type { RouteLocationRaw } from 'vue-router';
import { playbackManager } from '@/store/playback-manager';
import { isNil } from '@/utils/validation';

/**
 * Validates that no playback is happening when accesing a route
 */
export function playbackGuard(): RouteLocationRaw | boolean {
  if (isNil(playbackManager.currentItem)) {
    return { path: '/', replace: true };
  }

  return true;
}
