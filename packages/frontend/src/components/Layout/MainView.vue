<template>
  <JTransition
    :name="route.meta.layout.transition.enter ?? defaultTransition"
    :mode="defaultTransitionMode ?? route.meta.layout.transition.mode"
    skip-pausing>
    <Suspense :suspensible="!root">
      <div
        :key="root ? route.meta.layout.name ?? 'default' : route.name"
        class="uno-h-full">
        <Component
          :is="root ? getLayoutComponent(route.meta.layout.name) : comp">
          <MainView
            v-if="root"
            :comp
            :route />
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
import { effectScope, getCurrentInstance, onErrorCaptured, onScopeDispose, shallowRef, watch, type Component } from 'vue';
import type { RouteLocationNormalizedGeneric, RouteMeta } from 'vue-router';
import { onRouteRendered } from 'vue-router/experimental';
import { pauseTree } from '@jellyfin-vue/ui-toolkit/composables/use-pausable-effect.ts';
import DefaultLayout from '#/layouts/default.vue';
import FullPageLayout from '#/layouts/fullpage.vue';
import ServerLayout from '#/layouts/server.vue';
import { router } from '#/plugins/router/index.ts';

/**
 * Return the appropiate layout component according to the route's meta.layout property
 */
function getLayoutComponent(layout: RouteMeta['layout']['name']): Component {
  switch (layout) {
    case 'fullpage': {
      return FullPageLayout as Component;
    }
    case 'server': {
      return ServerLayout as Component;
    }
    default: {
      return DefaultLayout;
    }
  }
}

const defaultTransition = 'slide-x-reverse';
const defaultTransitionMode = 'out-in';
const apploaded = shallowRef(false);
</script>

<script setup lang="ts">
const { comp, route, root } = defineProps<{
  comp: Component;
  route: RouteLocationNormalizedGeneric;
  /**
   * The root view renders the layout and the nested view, which renders the page
   */
  root?: boolean;
}>();

if (root) {
  const view = getCurrentInstance()!;
  let resume: (() => void) | undefined;
  const unfreeze = () => {
    resume?.();
    resume = undefined;
  };

  /**
   * Until the new page is rendered, the view must keep displaying the leaving page as is, so we pause the DOM patching
   * and the effects of everything that is being displayed. The new page still gets rendered, since the components
   * in between receive it through forced updates from their parents, which aren't affected by pausing.
   *
   * Changes to the same route (like params or query changes) must remain reactive, since they don't render a new page.
   *
   * The watcher runs in its own scope, so it's not paused alongside the view.
   */
  const routeScope = effectScope(true);

  routeScope.run(() => {
    watch(() => router.currentRoute.value.name, () => {
      resume ??= pauseTree(view);
    }, { flush: 'sync' });
  });
  onScopeDispose(() => routeScope.stop());

  onRouteRendered(() => {
    unfreeze();
    apploaded.value = true;
  });
  onErrorCaptured((e, instance, info) => {
    console.error('[Jellyfin] Error captured in MainView:', e, instance, info);
    unfreeze();
    apploaded.value = true;
  });
}
</script>
