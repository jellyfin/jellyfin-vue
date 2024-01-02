<template>
  <TransitionView :transition-key="route.meta.layout">
    <SuspenseView>
      <component :is="getLayoutComponent(route.meta.layout)" />
    </SuspenseView>
  </TransitionView>
</template>

<script setup lang="ts">
import { useRoute, type RouteMeta } from 'vue-router/auto';
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';

const route = useRoute();

/**
 * Return the appropiate layout component according to the route's meta.layout property
 */
function getLayoutComponent(layout: RouteMeta['layout']): typeof DefaultLayout {
  switch (layout) {
    case 'fullpage': {
      return FullPageLayout;
    }
    case 'server': {
      return ServerLayout;
    }
    default: {
      return DefaultLayout;
    }
  }

}
</script>
