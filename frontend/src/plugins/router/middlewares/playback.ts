import { playbackManager } from '@/store/playbackManager';
import { isNil } from '@/utils/validation';
import type { RouteLocationRaw } from 'vue-router';

/**
 * Validates that no playback is happening when accesing a route
 */
export function playbackGuard(): RouteLocationRaw | boolean {
  if (isNil(playbackManager.currentItem)) {
    return { path: '/', replace: true };
  }

  return true;
}
