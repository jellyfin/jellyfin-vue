<template>
  <JSlot :style>
    <slot />
  </JSlot>
</template>

<script setup lang="ts">
/**
 * TODO: this component should shim the main tag
 */
import { ref, provide } from 'vue';
import { JMain_style } from '#/store/keys';
import JSlot from '#/components/JSlot.vue';

const style = ref([]);

provide(JMain_style, style);
</script>
