<template>
  <JTransition>
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop sizing">
      <BlurhashCanvas
        :hash="blurhash"
        :width="32"
        :height="32"
        class="sizing" />
    </div>
  </JTransition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const opacity = computed(() => route.meta.layout.backdrop.opacity ?? 0.25);
const blurhash = computed(() => route.meta.layout.backdrop.blurhash);
</script>

<style scoped>
.backdrop {
  background-color: rgb(var(--v-theme-background));
  opacity: v-bind(opacity);
}

.sizing {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
}
</style>
