<template>
  <transition name="fade" mode="in-out">
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop"
      :style="`--o:${opacity}`"
    >
      <blurhash-canvas :hash="blurhash" :width="32" :height="32" />
    </div>
  </transition>
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

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

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
    mix-blend-mode: screen;
    opacity: var(--o);
  }
}

.theme--dark .backdrop::after {
  background-color: #{map-get($material-dark, 'background')};
  mix-blend-mode: multiply;
}
</style>
