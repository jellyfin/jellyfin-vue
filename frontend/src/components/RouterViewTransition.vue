<template>
  <router-view v-if="enableTransitions" v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'" mode="out-in">
      <!-- This div is required because <transition> requires a single children node -->
      <div
        :key="getKey(route)"
        :class="
          isRoot
            ? 'router-view-root-transition-wrapper'
            : 'router-view-transition-wrapper'
        ">
        <component :is="Component" />
      </div>
    </transition>
  </router-view>

  <router-view v-else v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<script setup lang="ts">
import { RouteLocationNormalized } from 'vue-router';

interface Props {
  /**
   * Root transitions happen between layout changes. e.g. from `default` layout to `main` and viceversa.
   * This should be "true" for the App.vue component
   * Non-root transitions happen between pages of the same layout, e.g. from `home` to `profile` both using the `main`
   * layout
   */
  isRoot?: boolean;
  enableTransitions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isRoot: false,
  enableTransitions: true
});

/**
 * Gets the key to re-render the component tree of the current page
 */
function getKey(route: RouteLocationNormalized): string {
  if (props.isRoot) {
    return route.meta.layout.name;
  }

  return String(route.name);
}
</script>
