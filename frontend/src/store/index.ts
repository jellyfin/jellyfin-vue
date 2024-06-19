import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { computedAsync, useFps, useMediaControls, useMediaQuery, useNetwork, useNow, useScroll } from '@vueuse/core';
import { shallowRef, computed } from 'vue';
import { remote } from '@/plugins/remote';
import { isNil } from '@/utils/validation';
/**
 * This file contains global variables (specially VueUse refs) that are used multiple times across the client.
 * VueUse composables will set new event handlers, so it's more
 * efficient to reuse those, both in components and TS files.
 */

/**
 * Reactive Date.now() instance
 */
export const now = useNow();
/**
 * Reactive window scroll
 */
export const windowScroll = useScroll(window);
/**
 * Ref to the local media player
 */
export const mediaElementRef = shallowRef<HTMLMediaElement>();
/**
 * Reactive media controls of the local media player
 */
export const mediaControls = useMediaControls(mediaElementRef);
/**
 * WebAudio instance of the local media player
 */
export const mediaWebAudio = {
  context: new AudioContext(),
  sourceNode: undefined as undefined | MediaElementAudioSourceNode
};
/**
 * Reactively tracks if the user wants animations (false) or not (true).
 */
export const prefersNoMotion = useMediaQuery('(prefers-reduced-motion)');

/**
 * IWhether the user is using a pointer with high precision (like a mouse)
 */
export const hasFinePointer = useMediaQuery('(any-pointer:fine)');
/**
 * Whether the user is using a pointer with low precision (like touch)
 */
export const hasTouch = useMediaQuery('(any-pointer:coarse)');

/**
 * Track if there's HDR support in the screen
 */
export const hasHDRDisplay = useMediaQuery('(video-dynamic-range:high)');

/**
 * Track performance
 */
const fps = useFps();
const isLowRefreshRateScreen = useMediaQuery('(update:slow)');
export const isSlow = computed(() => isLowRefreshRateScreen.value || fps.value <= 15);

/**
 * Reactively tracks if the user is connected to the server
 */
const network = useNetwork();
export const isConnectedToServer = computedAsync(async () => {
  if (network.isSupported.value && network.isOnline.value) {
    return true;
  } else if (!isNil(remote.auth.currentServer) || !remote.socket.isConnected.value) {
    try {
      await remote.sdk.newUserApi(getSystemApi).getPingSystem();

      return true;
    } catch {}
  }

  return false;
}, true);
