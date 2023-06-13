import { whenever, useMagicKeys, noop } from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';

/**
 * Register keyboard player control.
 * @param fullscreen - Arrow key updates when playback is happening outside of fullscreen are ignored
 * @param osdHandler - show the player osd for a short period whenever a suitable action is called
 */
export function usePlayerKeys(osdHandler = noop): void {
  const keys = useMagicKeys();
  const playbackManager = playbackManagerStore();
  const playerElement = playerElementStore();

  const forwardFn = (): void => {
    playbackManager.skipForward();
    osdHandler();
  };
  const backwardFn = (): void => {
    playbackManager.skipBackward();
    osdHandler();
  };

  whenever(keys.MediaPause, playbackManager.pause);
  whenever(keys.Pause, playbackManager.pause);
  whenever(keys.MediaPlay, playbackManager.unpause);
  whenever(keys.MediaPlayPause, playbackManager.playPause);
  whenever(keys.MediaStop, playbackManager.stop);
  whenever(keys.Exit, playbackManager.stop);
  whenever(keys.MediaTrackNext, playbackManager.setNextTrack);
  whenever(keys.MediaTrackPrevious, playbackManager.setPreviousTrack);
  whenever(keys.MediaFastForward, forwardFn);
  whenever(keys.MediaRewind, backwardFn);
  whenever(keys.AudioVolumeMute, playbackManager.toggleMute);
  whenever(keys.AudioVolumeUp, playbackManager.volumeUp);
  whenever(keys.AudioVolumeDown, playbackManager.volumeDown);

  whenever(keys.space, playbackManager.playPause);
  whenever(keys.k, playbackManager.playPause);
  whenever(keys.m, playbackManager.toggleMute);
  whenever(keys.j, backwardFn);
  whenever(keys.l, forwardFn);

  /**
   * This key conflicts with the browser's fullscreen function in the
   * fullscreen video player, hence why we skip it
   */
  if (!playerElement.isFullscreenVideoPlayer) {
    whenever(keys.f, playerElement.toggleFullscreenPlayer);
  }

  if (playerElement.isFullscreenPlayer) {
    whenever(keys.ArrowUp, playbackManager.volumeUp);
    whenever(keys.ArrowDown, playbackManager.volumeDown);
    whenever(keys.ArrowLeft, backwardFn);
    whenever(keys.ArrowRight, forwardFn);
  }
}
