<template>
  <JTransition
    :name="route.meta.layout.transition.enter ?? defaultTransition"
    :mode="defaultTransitionMode ?? route.meta.layout.transition.mode"
    skip-pausing>
    <Suspense
      :suspensible="!root"
      @pending="resolved = false"
      @resolve=" resolved = true">
      <div
        :key="root ? route.meta.layout.name ?? 'default' : route.name"
        class="uno-h-full">
        <Component
          :is="root ? getLayoutComponent(route.meta.layout.name) : comp">
          <MainView
            v-if="root"
            v-bind="$props" />
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
import { onErrorCaptured, shallowRef, type Component, watch, computed, provide, useId, ref, type WatchOptions, inject } from 'vue';
import type { RouteLocationNormalizedGeneric, RouteMeta } from 'vue-router';
import { isNil } from '@jellyfin-vue/shared/validation';
import { usePausableEffect } from '@jellyfin-vue/ui-toolkit/composables/use-pausable-effect.ts';
import DefaultLayout from '#/layouts/default.vue';
import FullPageLayout from '#/layouts/fullpage.vue';
import ServerLayout from '#/layouts/server.vue';
import { JView_isRouting } from '#/store/keys';
import { router } from '#/plugins/router';

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
const watchOps = { flush: 'sync' } satisfies WatchOptions;
const apploaded = shallowRef(false);
const isRouting = shallowRef(false);
const _resolveStatus = ref<Record<string, boolean>>({});
const allResolved = computed(() => Object.values(_resolveStatus.value).every(Boolean));
const mustBePaused = computed(() => !allResolved.value || isRouting.value);

watch(() => router.currentRoute.value.name, () => isRouting.value = true, watchOps);
watch(allResolved, () => isRouting.value = false, watchOps);
</script>

<script setup lang="ts">
const { comp, route } = defineProps<{
  comp: Component;
  route: RouteLocationNormalizedGeneric;
}>();

const id = useId();
const root = isNil(inject(JView_isRouting));

const resolved = computed({
  get() {
    return _resolveStatus.value[id] ?? false;
  },
  set(newVal) {
    _resolveStatus.value[id] = newVal;

    if (root && newVal) {
      apploaded.value = true;
    }
  }
});

if (root) {
  provide(JView_isRouting, mustBePaused);
  usePausableEffect(mustBePaused);
  onErrorCaptured(() => {
    resolved.value = true;
    isRouting.value = false;
  });
}
</script>
