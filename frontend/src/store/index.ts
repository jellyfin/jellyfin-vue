import { useMediaControls, useMediaQuery, useNetwork, useNow, useScroll } from '@vueuse/core';
import { shallowRef } from 'vue';
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
 * Reactively tracks if the user is connected to the internet
 */
export const network = useNetwork();
