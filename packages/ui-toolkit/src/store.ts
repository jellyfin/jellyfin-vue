/**
 * This module contains application-level state (specially VueUse refs)
 * that are used multiple times across the client. VueUse composables will set
 * new event handlers/effects, so it's more efficient to reuse those,
 * both in components and TS files.
 */
import { useMediaQuery, useWindowSize } from '@vueuse/core';

export const windowSize = useWindowSize();

/**
 * Track severely underpowered devices:
 * https://developer.mozilla.org/en-US/docs/Web/CSS/@media/update
 */
export const isSlow = useMediaQuery('(update:slow)');

/**
 * Reactively tracks if the user wants animations (false) or not (true).
 */
export const prefersNoMotion = useMediaQuery('(prefers-reduced-motion:reduce)');
