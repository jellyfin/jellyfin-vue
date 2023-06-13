import { whenever, useMagicKeys, refAutoReset } from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';

export const focusedTimeSlider = refAutoReset(false, 1000);
export const focusedVolumeSlider = refAutoReset(false, 1000);

/**
 * Register keyboard player control.
 * @param fullscreen - Arrow key updates when playback is happening outside of fullscreen are ignored
 * @param osdHandler - show the player osd for a short period whenever a suitable action is called
 */
export function usePlayerKeys(): void {
  const keys = useMagicKeys();
  const playbackManager = playbackManagerStore();
  const playerElement = playerElementStore();

  whenever(keys.MediaPause, playbackManager.pause);
  whenever(keys.Pause, playbackManager.pause);
  whenever(keys.MediaPlay, playbackManager.unpause);
  whenever(keys.MediaPlayPause, playbackManager.playPause);
  whenever(keys.MediaStop, playbackManager.stop);
  whenever(keys.Exit, playbackManager.stop);
  whenever(keys.MediaTrackNext, playbackManager.setNextTrack);
  whenever(keys.MediaTrackPrevious, playbackManager.setPreviousTrack);
  whenever(keys.MediaFastForward, () => (focusedTimeSlider.value = true));
  whenever(keys.MediaRewind, () => (focusedTimeSlider.value = true));
  whenever(keys.AudioVolumeMute, playbackManager.toggleMute);
  whenever(keys.AudioVolumeUp, () => (focusedVolumeSlider.value = true));
  whenever(keys.AudioVolumeDown, () => (focusedVolumeSlider.value = true));

  whenever(keys.space, playbackManager.playPause);
  whenever(keys.k, playbackManager.playPause);
  whenever(keys.m, playbackManager.toggleMute);
  whenever(keys.j, () => (focusedTimeSlider.value = true));
  whenever(keys.l, () => (focusedTimeSlider.value = true));

  /**
   * This key conflicts with the browser's fullscreen function in the
   * fullscreen video player, hence why we skip it
   */
  if (!playerElement.isFullscreenVideoPlayer) {
    whenever(keys.f, playerElement.toggleFullscreenPlayer);
  }

  if (playerElement.isFullscreenPlayer) {
    whenever(keys.ArrowUp, () => (focusedVolumeSlider.value = true));
    whenever(keys.ArrowDown, () => (focusedVolumeSlider.value = true));
    whenever(keys.ArrowLeft, () => (focusedTimeSlider.value = true));
    whenever(keys.ArrowRight, () => (focusedTimeSlider.value = true));
  }
}
