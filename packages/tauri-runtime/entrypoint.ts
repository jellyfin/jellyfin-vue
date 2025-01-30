/**
 * Every polyfilled feature must be in their own module.
 */
import '#/fullscreen.ts';
/**
 * The Tauri-specific code must be loaded before the frontend code to ensure that
 * all the polyfills for the runtime have been loaded
 * before the frontend code is executed.
 *
 * THIS IMPORT ALWAYS NEEDS TO BE THE LAST IMPORT IN THIS FILE
 */
import '@jellyfin-vue/frontend';
