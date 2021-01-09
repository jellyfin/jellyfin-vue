<template>
  <transition name="fade" mode="in-out">
    <canvas
      v-if="validHash"
      v-show="!loading"
      ref="canvas"
      :width="width"
      :height="height"
    />
  </transition>
</template>

<script lang="ts">
import Vue from 'vue';
import getPixels from '~/plugins/workers/blurhash.worker';

export default Vue.extend({
  props: {
    hash: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 32
    },
    height: {
      type: Number,
      default: 32
    },
    punch: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      validHash: true,
      loading: true
    };
  },
  watch: {
    hash(): void {
      this.$nextTick(() => {
        this.draw();
      });
    }
  },
  mounted() {
    this.draw();
  },
  methods: {
    async draw(): Promise<void> {
      const ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d');
      const imageData = ctx?.createImageData(this.width, this.height);
      try {
        const pixels = await getPixels(
          this.hash,
          this.width,
          this.height,
          this.punch
        );
        if (imageData) {
          imageData.data.set(pixels);
          ctx?.putImageData(imageData, 0, 0);
          this.loading = false;
        }
      } catch {
        this.validHash = false;
      }
    }
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
