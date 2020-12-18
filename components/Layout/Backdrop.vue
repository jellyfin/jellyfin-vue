<template>
  <div v-if="blurhash" class="backdrop">
    <v-fade-transition>
      <blurhash-canvas :hash="blurhash" :width="32" :height="18" />
    </v-fade-transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    blurhash(): string | boolean {
      if (this.$store.state.backdrop.blurhash) {
        return this.$store.state.backdrop.blurhash;
      }

      return false;
    }
  }
});
</script>

<style lang="scss">
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
    opacity: 0.75;
  }
}

.theme--dark .backdrop::after {
  background-color: #{map-get($material-dark, 'background')};
}
</style>
