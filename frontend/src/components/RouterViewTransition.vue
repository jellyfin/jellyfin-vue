<template>
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="!prefersNoMotion ? getTransitionName(route) : undefined"
      mode="out-in">
      <!-- This div is required because <transition> requires a single children node -->
      <div
        :key="isRoot ? route.meta.layout : String(route.path)"
        style="transform-origin: center"
        class="h-100">
        <Suspense
          :suspensible="!isRoot"
          @pending="isRoot ? useLoading().start : undefined"
          @resolve="isRoot ? useLoading().finish : undefined">
          <Component :is="Component" />
        </Suspense>
      </div>
    </Transition>
  </RouterView>
</template>

<script lang="ts">
import { RouteLocationNormalizedLoaded } from 'vue-router';
import { useMediaQuery } from '@vueuse/core';
import { useLoading } from '@/composables';

const prefersNoMotion = useMediaQuery('(prefers-reduced-motion)');
</script>

<script setup lang="ts">
defineProps<{
  /**
   * Root transitions happen between layout changes. e.g. from `default` layout to `main` and viceversa.
   * This should be "true" for the App.vue component
   * Non-root transitions happen between pages of the same layout, e.g. from `home` to `profile` both using the `main`
   * layout
   */
  isRoot?: boolean;
}>();

/**
 * Based on a route's meta.transition properties, return the transition name to use
 */
function getTransitionName(
  route: RouteLocationNormalizedLoaded
): undefined | string {
  if (route.meta.transition?.enter) {
    return route.meta.transition.enter;
  }

  return 'scroll-x-reverse-transition';
}
</script>
