import { Context } from '@nuxt/types';
import { pageStore, defaultBackdropOpacity } from '~/store/page';

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
export default function ({ route }: Context): void {
  const meta = route.meta?.[0] as RouteMeta;
  const page = pageStore();
  const currentBackdrop = page.backdrop;

  /** Change backdrop state based on meta */
  if (
    (meta.backdrop === false || typeof meta.backdrop === 'undefined') &&
    currentBackdrop.blurhash
  ) {
    page.clearBackdrop();
  } else if (
    meta.backdrop === true &&
    currentBackdrop.opacity !== defaultBackdropOpacity
  ) {
    page.resetBackdropOpacity();
  } else if (
    typeof meta.backdrop !== 'boolean' &&
    typeof meta.backdrop?.opacity !== 'undefined'
  ) {
    page.backdrop.opacity = meta.backdrop.opacity;
  }

  /** Change AppBar state based on meta */
  page.opaqueAppBar = !meta.transparentAppBar;
}
