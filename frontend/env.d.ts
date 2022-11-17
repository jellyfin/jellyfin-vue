/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />
/// <reference types="vite-plugin-vue-layouts/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';

  const component: DefineComponent<never, never, never>;
  export default component;
}

declare const __COMMIT_HASH__: string;
declare const __HISTORY_ROUTER_MODE__: boolean;
