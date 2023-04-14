/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />
/// <reference types="vite-plugin-vue-layouts/client" />

declare const __COMMIT_HASH__: string;

// Extend the global Window interface
interface Window {
  __TAURI__?: unknown;
  __TAURI_METADATA__?: unknown;
}
