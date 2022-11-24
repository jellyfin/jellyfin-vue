<template>
  <v-fade-transition>
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop"
      :style="`--o:${opacity}`">
      <blurhash-canvas :hash="blurhash" :width="32" :height="32" />
    </div>
  </v-fade-transition>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const blurhash = route.meta.backdrop?.blurhash;
const opacity = route.meta.backdrop?.opacity || 0.75;
</script>

<style lang="scss" scoped>
.backdrop {
  & canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
  }

  // &::after {
  //   content: '';
  //   position: fixed;
  //   top: 0;
  //   bottom: 0;
  //   left: 0;
  //   right: 0;
  //   background-color: #{map-get($material-light, 'background')};
  //   opacity: var(--o);
  // }
}

// .theme--dark .backdrop::after {
//   background-color: #{map-get($material-dark, 'background')};
// }
</style>
