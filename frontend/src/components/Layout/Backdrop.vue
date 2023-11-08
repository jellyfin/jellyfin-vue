<template>
  <VFadeTransition>
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop">
      <BlurhashCanvas
        :hash="blurhash"
        :width="32"
        :height="32" />
    </div>
  </VFadeTransition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router/auto';

const route = useRoute();
const blurhash = computed(() => route.meta.backdrop?.blurhash);
const opacity = computed(() => route.meta.backdrop?.opacity || 0.25);
</script>

<style lang="scss" scoped>
.backdrop {
  background-color: rgb(var(--v-theme-background));
  opacity: v-bind(opacity);
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;

  & canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
  }
}
</style>
