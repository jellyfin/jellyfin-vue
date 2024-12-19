/**
 * This module contains application-level state (specially VueUse refs)
 * that are used multiple times across the client. VueUse composables will set
 * new event handlers/effects, so it's more efficient to reuse those,
 * both in components and TS files.
 */
import { useWindowSize } from '@vueuse/core';

export const windowSize = useWindowSize();
