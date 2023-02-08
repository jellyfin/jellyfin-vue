import 'vue-router';
// eslint-disable-next-line no-restricted-imports
import { RemotePlugin } from '@/plugins/remote/types';
import 'vue-i18n';

/**
 * The object that represents RouteMeta is defined at @/plugins/vue/router/middleware/meta
 */
interface BackdropPayload {
  blurhash?: string;
  opacity?: number;
}
declare module 'vue-router' {
  interface RouteMeta {
    readonly layout: string;
    transparentLayout?: boolean;
    transition?: string;
    readonly admin: boolean;
    title?: string | null;
    backdrop: BackdropPayload;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    readonly $remote: RemotePlugin;
  }
}

declare module 'vue-i18n' {
  interface Composer {
    /**
     * An array of the locale codes that matches the locale name
     */
    readonly localeNames: Record<string, string>;
  }
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */

export {};
