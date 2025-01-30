This is the package that provides a build from `@jellyfin-vue/frontend` with all the Tauri-specific
code, since `@jellyfin-vue/frontend` must not have any code that doesn't belong to the DOM/Browser environment.

It works by injecting the Tauri logic into the standard `document`, `window` or `globalThis` objects
(or any other relevant global) and loading those modules before the frontend's one, so Tauri code is loaded
always first.

See `entrypoint.ts` and `src/fullscreen.ts` for an example.

Every "polyfilled" feature must be in their own module to keep the logic simple enough.
