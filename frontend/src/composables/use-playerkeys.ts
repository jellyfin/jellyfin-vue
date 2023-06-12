import {
  onKeyStroke,
  whenever,
  useMagicKeys,
  useThrottleFn
} from '@vueuse/core';
import playbackManager from '@/store/playbackManager';

import { isTizen, isWebOS } from '@/utils/browser-detection';

/**
 * Register keyboard player control.
 * @param osdHandler - show the player osd for a short period whenever a suitable action is called
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function usePlayerKeys(osdHandler = (): void => {}): void {
  const keys = useMagicKeys();

  whenever(keys.mediapause, playbackManager.pause);
  whenever(keys.mediaplay, playbackManager.unpause);
  whenever(keys.mediaplaypause, playbackManager.playPause);
  whenever(keys.mediastop, playbackManager.stop);
  whenever(keys.mediatracknext, playbackManager.setNextTrack);
  whenever(keys.mediatrackprevious, playbackManager.setPreviousTrack);
  whenever(keys.audiovolumemute, playbackManager.toggleMute);

  whenever(keys.space, playbackManager.playPause);
  whenever(keys.k, playbackManager.playPause);
  whenever(keys.m, playbackManager.toggleMute);

  const throttledForwardFn = useThrottleFn(() => {
    playbackManager.skipForward();
    osdHandler();
  }, 100);

  const throttledBackwardFn = useThrottleFn(() => {
    playbackManager.skipBackward();
    osdHandler();
  }, 100);

  onKeyStroke('AudioVolumeUp', playbackManager.volumeUp);
  onKeyStroke('AudioVolumeDown', playbackManager.volumeDown);
  onKeyStroke('j', throttledBackwardFn);
  onKeyStroke('l', throttledForwardFn);

  if (!isTizen() && !isWebOS()) {
    onKeyStroke('ArrowUp', playbackManager.volumeUp);
    onKeyStroke('ArrowDown', playbackManager.volumeDown);
    onKeyStroke('ArrowLeft', throttledBackwardFn);
    onKeyStroke('ArrowRight', throttledForwardFn);
  }
}
