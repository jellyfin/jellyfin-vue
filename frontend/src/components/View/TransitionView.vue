<template>
  <Transition
    v-if="!prefersNoMotion"
    :name="getTransitionName(route.meta)"
    mode="out-in">
    <!-- This div is required because <transition> requires a single children node -->
    <div
      :key="transitionKey"
      v-bind="$attrs"
      style="transform-origin: center"
      class="h-100">
      <slot />
    </div>
  </Transition>
  <slot v-else />
</template>

<script setup lang="ts">
import { prefersNoMotion } from '@/store';
import { type RouteMeta, useRoute } from 'vue-router/auto';

defineProps<{
  transitionKey: string;
}>();

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
