<template>
  <main
    class="uno-max-w-full uno-grow-1 uno-shrink-0 uno-basis-auto uno-transition-all j-main"
    :style="mainStyles">
    <slot />
  </main>
</template>

<script setup lang="ts">
/**
 * TODO: CSS still depends on Vuetify, remove scoped styles after removal
 */
import { useLayout } from 'vuetify';

const { mainStyles } = useLayout();
</script>

<style scoped>
.j-main {
  padding-left: var(--v-layout-left);
  padding-right: var(--v-layout-right);
  padding-top: var(--v-layout-top);
  padding-bottom: var(--v-layout-bottom);
}
</style>
