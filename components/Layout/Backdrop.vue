<template>
  <v-fade-transition>
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop"
      :style="`--o:${opacity}`"
    >
      <blurhash-canvas :hash="blurhash" :width="32" :height="32" />
    </div>
  </v-fade-transition>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    blurhash: {
      get(): string {
        return this.$store.state.backdrop.blurhash;
      }
    },
    opacity: {
      get(): number {
        return this.$store.state.backdrop.opacity;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.backdrop {
  & canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
  }
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #{map-get($material-light, 'background')};
    opacity: var(--o);
  }
}

.theme--dark .backdrop::after {
  background-color: #{map-get($material-dark, 'background')};
}
</style>
