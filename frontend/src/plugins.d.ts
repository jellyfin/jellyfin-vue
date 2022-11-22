import 'vue-router';
import { RemotePlugin } from './plugins/vue/remote/types';

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string;
    transition?: string;
    public?: boolean;
  }
}

declare module 'vue' {
  export interface ComponentCustomProperties {
    $remote: RemotePlugin;
  }
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */

export {};
