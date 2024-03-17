import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { computedAsync, useMediaControls, useMediaQuery, useNetwork, useNow, useScroll } from '@vueuse/core';
import { shallowRef } from 'vue';
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
 * Reactively tracks if the device has a high precision input (like a mouse)
 */
export const isFinePointer = useMediaQuery('(pointer:fine)');

/**
 * Reactively tracks if the user is connected to the server
 */
const network = useNetwork();
export const isConnectedToServer = computedAsync(async () => {
  if ((network.isSupported.value && network.isOnline.value)) {
    return true;
  } else if (!isNil(remote.auth.currentServer) && !remote.socket.isConnected.value) {
    try {
      await remote.sdk.newUserApi(getSystemApi).getPingSystem();

      return true;
    } catch {}
  }

  return false;
}, true);
