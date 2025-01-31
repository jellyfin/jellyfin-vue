import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import {
  computedAsync,
  useMediaControls,
  useMediaQuery,
  useNetwork,
  useNow,
  useDocumentVisibility,
  useWindowScroll
} from '@vueuse/core';
import { computed, shallowRef } from 'vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';
import { router } from '#/plugins/router';

/**
 * == BLURHASH DEFAULTS ==
 * By default, 20x20 pixels with a punch of 1 is returned.
 * Although the default values recommended by Blurhash developers is 32x32,
 * a size of 20x20 seems to be the sweet spot for us, improving the performance
 * and reducing the memory usage, while retaining almost full blur quality.
 * Lower values had more visible pixelation
 */
export const BLURHASH_DEFAULT_WIDTH = 20;
export const BLURHASH_DEFAULT_HEIGHT = 20;
export const BLURHASH_DEFAULT_PUNCH = 1;

/**
 * Reactive Date.now() instance
 */
export const now = useNow();
/**
 * Reactive window scroll
 */
export const windowScroll = useWindowScroll();
/**
 * Reactive document visibility
 */
const documentVisibility = useDocumentVisibility();
export const isDocumentVisible = computed(() => documentVisibility.value === 'visible');
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
  sourceNode: undefined as undefined | MediaElementAudioSourceNode,
  gainNode: undefined as undefined | GainNode
};

/**
 * Reactively tracks if the user wants transparency effects (true) or not (false).
 */
export const prefersNoTransparency = useMediaQuery('(prefers-reduced-transparency:reduce)');
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
 * Whether the layout must use transparency effects
 */
export const transparencyEffects = computed(() => !prefersNoTransparency.value && router.currentRoute.value.meta.layout.transparent);

/**
 * Reactively tracks if the user is connected to the server
 */
const network = useNetwork();
export const isConnectedToServer = computedAsync(async () => {
  /**
   * These can't be merged inside the if statement as they must be picked up by watchEffect, and the OR operation
   * stops evaluating in the first await tick as soon as the first truthy value is found.
   *
   * See https://vuejs.org/guide/essentials/watchers.html#watcheffect
   */
  const socket = remote.socket.isConnected.value;
  const networkAPI = network.isOnline.value;

  if (!isNil(remote.auth.currentServer.value) || !socket || !networkAPI) {
    try {
      await remote.sdk.newUserApi(getSystemApi).getPingSystem();

      return true;
    } catch {}
  }

  return false;
}, true);
