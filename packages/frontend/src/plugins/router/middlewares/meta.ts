import { defu } from 'defu';
import { ref, toRaw } from 'vue';
import type {
  NavigationGuardReturn,
  RouteLocationNormalized,
  RouteMeta
} from 'vue-router';

const defaultMeta = (): RouteMeta => ({
  layout: {
    transition: {}
  }
});

const reactiveMeta = ref(defaultMeta());

/**
 * This middleware handles the meta property between routes
 *
 * The layout of a page is given by the route group it lives in: the component of the group
 * (e.g. src/pages/(server).vue) is the parent route of all the pages in it (src/pages/(server)/*).
 *
 * The properties that need to be resolved before the component is instantiated (i.e, the admin
 * property, so the correct redirection is done, or the page transitions) need the following block in pages:
 *
 * definePage({
 *  meta: {
 *   layout: {
 *     transition: {
 *       enter: 'slide-y-reverse'
 *     }
 *    }
 *  }
 *});
 *
 * That populates the meta property through Vite at build time, so the router
 * instantiation looks like this: https://router.vuejs.org/guide/advanced/meta.html#route-meta-fields
 *
 * If we want to change the meta at runtime (for page title, backdrop, etc), we need to merge
 * whatever default value is defined in the route block with our custom properties. In order
 * to ensure consistency, we pass an object with defaults that matches the *RouteMeta* type
 * present at the plugins.d.ts file
 */
export function metaGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): NavigationGuardReturn {
  reactiveMeta.value = defu(to.meta, defaultMeta());
  /**
   * This is needed to ensure all the meta matches the expected data
   */
  from.meta = defu(toRaw(from.meta), defaultMeta());
  to.meta = reactiveMeta.value;

  if (from.meta.layout.transition.leave) {
    to.meta.layout.transition.enter = from.meta.layout.transition.leave;
  }
}
