<template>
  <JTransition
    :name="route.meta.layout.transition.enter ?? defaultTransition"
    :mode="defaultTransitionMode ?? route.meta.layout.transition.mode">
    <Suspense :suspensible="!root">
      <div
        :key="root ? route.matched[0]?.name : route.name"
        class="uno-h-full">
        <Component :is="comp">
          <RouterView
            v-if="root"
            v-slot="{ Component: page }"
            :route>
            <MainView
              :comp="page"
              :route />
          </RouterView>
          <slot v-else />
        </Component>
      </div>
      <template
        v-if="!apploaded && root"
        #fallback>
        <Splashscreen />
      </template>
    </Suspense>
  </JTransition>
</template>

<script lang="ts">
import { effectScope, inject, onErrorCaptured, onScopeDispose, provide, shallowRef, watch, type Component, type InjectionKey } from 'vue';
import type { RouteLocationNormalizedGeneric } from 'vue-router';
import { onRouteRendered, useScrollRestoration } from 'vue-router/experimental';
import { usePausableEffect } from '@jellyfin-vue/ui-toolkit/composables/use-pausable-effect.ts';
import { router } from '#/plugins/router/index.ts';

const defaultTransition = 'slide-x-reverse';
const defaultTransitionMode = 'out-in';
const apploaded = shallowRef(false);
/**
 * The root view pauses the displayed tree, while the nested view knows when the new page has been rendered
 */
const unfreezeKey: InjectionKey<() => void> = Symbol('MainView unfreeze');
</script>

<script setup lang="ts">
const { comp, route, root } = defineProps<{
  comp: Component;
  route: RouteLocationNormalizedGeneric;
  /**
   * The root view renders the layout (the route group's component) and the nested view, which renders the page
   */
  root?: boolean;
}>();

if (root) {
  const frozen = shallowRef(false);
  const unfreeze = () => {
    frozen.value = false;
  };

  /**
   * Until the new page is rendered, the view must keep displaying the leaving page as is, so we pause the DOM patching
   * and the effects of everything that is being displayed, except the components that opt out with usePausableEffect
   * (like the playback controls). The new page still gets rendered, since the components in between receive it through
   * forced updates from their parents, which aren't affected by pausing. That's why the nested RouterView receives the
   * route as a prop: otherwise it would only react to it through its own (paused) effects.
   *
   * Changes to the same route (like params or query changes) must remain reactive, since they don't render a new page.
   *
   * The watcher runs in its own scope, so it's not paused alongside the view.
   */
  const routeScope = effectScope(true);

  routeScope.run(() => {
    watch(() => router.currentRoute.value.name, () => {
      frozen.value = true;
    }, { flush: 'sync' });
  });
  onScopeDispose(() => routeScope.stop());
  usePausableEffect(frozen);

  provide(unfreezeKey, unfreeze);
  onErrorCaptured((e, instance, info) => {
    console.error('[Jellyfin] Error captured in MainView:', e, instance, info);
    unfreeze();
    apploaded.value = true;
  });
} else {
  const unfreeze = inject(unfreezeKey)!;

  /**
   * The nested view lives inside the RouterView that displays the page, so these callbacks run once the new page
   * is rendered (the root view's closest RouterView displays the layout instead).
   * The view must be unfrozen before the scroll position is restored.
   */
  onRouteRendered(() => {
    unfreeze();
    apploaded.value = true;
  });
  useScrollRestoration();
}
</script>
