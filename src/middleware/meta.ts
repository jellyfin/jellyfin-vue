import { Context } from '@nuxt/types';
import { defaultState } from '~/store/page';

interface MetaBackdropPayload {
  opacity: number;
}
interface RouteMeta {
  transparentAppBar?: boolean;
  backdrop?: boolean | MetaBackdropPayload;
}

/**
 * Middleware that handles the meta tags that are present in pages.
 *
 * @param {Context} context - Nuxt application context
 * @returns {void}
 */
export default function ({ route, store }: Context): void {
  const meta = route.meta?.[0] as RouteMeta;
  const currentBackdrop = store.state.page.backdrop;

  /** Change backdrop state based on meta */
  if (
    (meta.backdrop === false || typeof meta.backdrop === 'undefined') &&
    currentBackdrop.blurhash
  ) {
    store.dispatch('page/clearBackdrop');
  } else if (
    meta.backdrop === true &&
    currentBackdrop.opacity !== defaultState().backdrop.opacity
  ) {
    store.dispatch('page/resetBackdropOpacity');
  } else if (
    typeof meta.backdrop !== 'boolean' &&
    typeof meta.backdrop?.opacity !== 'undefined'
  ) {
    store.dispatch('page/setBackdropOpacity', {
      newOpacity: meta.backdrop.opacity
    });
  }

  /** Change AppBar state based on meta */
  if (!meta.transparentAppBar) {
    store.dispatch('page/setAppBarOpacity', { opaqueAppBar: true });
  } else {
    store.dispatch('page/setAppBarOpacity', { opaqueAppBar: false });
  }
}
