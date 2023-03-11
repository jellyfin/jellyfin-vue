import 'vue-router';
// eslint-disable-next-line no-restricted-imports
import { RemotePlugin } from '@/plugins/remote/types';
// eslint-disable-next-line no-restricted-imports
import { languageMap } from '@/plugins/i18n';
import 'vue-i18n';

/**
 * The object that represents RouteMeta is defined at @/plugins/vue/router/middleware/meta
 */
interface BackdropPayload {
  blurhash?: string;
  opacity?: number;
}
interface RouteTransition {
  enter: string;
  leave?: string;
}
declare module 'vue-router' {
  interface RouteMeta {
    readonly layout: string;
    transparentLayout?: boolean;
    transition?: RouteTransition;
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
    readonly localeNames: typeof languageMap;
  }
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */

export {};
