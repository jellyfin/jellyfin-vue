<template>
  <TransitionView :transition-key="route.meta.layout">
    <Suspense>
      <component :is="getLayoutComponent(route.meta.layout)" />
    </Suspense>
  </TransitionView>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';
import type { Component } from 'vue';
import { useRoute, type RouteMeta } from 'vue-router/auto';

const route = useRoute();

/**
 * Return the appropiate layout component according to the route's meta.layout property
 */
function getLayoutComponent(layout: RouteMeta['layout']): Component {
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
</script>
