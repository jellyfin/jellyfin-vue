<template>
  <Transition
    v-if="!prefersNoMotion"
    :name="getTransitionName(route.meta)"
    mode="out-in">
    <slot />
  </Transition>
  <slot v-else />
</template>

<script setup lang="ts">
import { useRoute, type RouteMeta } from 'vue-router/auto';
import { prefersNoMotion } from '@/store';

const route = useRoute();

/**
 * Based on a route's meta.transition properties, return the transition name to use
 */
function getTransitionName(
  meta: RouteMeta
): undefined | string {
  if (meta.transition?.enter) {
    return meta.transition.enter;
  }

  return 'scroll-x-reverse-transition';
}
</script>
