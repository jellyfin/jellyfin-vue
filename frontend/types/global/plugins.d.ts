import type en from '@/../locales/en.json';
import type { JTransitionProps } from '@/components/lib/JTransition.vue';
import type { RemotePlugin } from '@/plugins/remote/types';

/**
 * The object that represents RouteMeta is defined at @/plugins/router/middleware/meta
 */
interface RouteTransitionPayload {
  enter?: NonNullable<JTransitionProps['name']>;
  leave?: JTransitionProps['name'];
  mode?: JTransitionProps['mode'];
}

interface LayoutPayload {
  readonly name?: 'default' | 'fullpage' | 'server';
  transparent?: boolean;
  transition: RouteTransitionPayload;
}
declare module 'vue-router' {
  interface RouteMeta {
    readonly layout: LayoutPayload;
    readonly admin?: boolean;
    title?: string | null;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    readonly $remote: RemotePlugin;
  }
}

declare module 'vue-i18n' {
  type messages = typeof en;

  export interface DefineLocaleMessage extends messages {}
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */

export { };
