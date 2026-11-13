/**
 * Unit tests run in plain Node on purpose (no DOM environment): the modules under test must stay pure.
 *
 * This file exists so Vitest does not load `vite.config.ts`, whose plugins are only meant for building the app.
 * The `#/` alias resolves through the `imports` field of package.json, like it does for the app.
 */
export { default } from '@jellyfin-vue/configs/vitest';
