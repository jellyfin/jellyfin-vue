<template>
  <JTransition>
    <div
      v-if="route.meta.backdrop.blurhash"
      :key="`backdrop-${route.meta.backdrop.blurhash}`"
      class="backdrop sizing">
      <BlurhashCanvas
        :hash="route.meta.backdrop.blurhash"
        :width="32"
        :height="32"
        class="sizing" />
    </div>
  </JTransition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router/auto';

const route = useRoute();
const opacity = computed(() => route.meta.backdrop.opacity);
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
