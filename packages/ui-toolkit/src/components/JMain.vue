<template>
  <main
    class="uno-max-w-full uno-flex-grow-1 uno-flex-shrink-0 uno-flex-basis-auto uno-transition-all j-main"
    :style="[mainStyles, ...style]">
    <slot />
  </main>
</template>

<script setup lang="ts">
/**
 * TODO: CSS still depends on Vuetify, remove scoped styles after removal
 */
import { ref, provide } from 'vue';
import { useLayout } from 'vuetify';
import { JMain_style } from '#/store/keys';

const style = ref([]);
const { mainStyles } = useLayout();

provide(JMain_style, style);
</script>

<style scoped>
.j-main {
  padding-left: var(--v-layout-left);
  padding-right: var(--v-layout-right);
  padding-top: var(--v-layout-top);
  padding-bottom: var(--v-layout-bottom);
}
</style>
