<template>
  <main
    class="v-main"
    :style="[mainStyles, ...style]">
    <slot />
  </main>
</template>

<script setup lang="ts">
/**
 * TODO: CSS still depends on Vuetify
 */
import { ref, provide } from 'vue';
import { useLayout } from 'vuetify';
import { JMain_style } from '#/store/keys';

const style = ref([]);
const { mainStyles } = useLayout();

provide(JMain_style, style);
</script>
