<template>
  <canvas v-if="validHash" ref="canvas" :width="width" :height="height" />
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
      validHash: true
    };
  },
  watch: {
    hash() {
      this.$nextTick(() => {
        this.draw();
      });
    }
  },
  mounted() {
    this.draw();
  },
  methods: {
    async draw() {
      const ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d');
      const imageData = ctx?.createImageData(this.width, this.height);
      try {
        const pixels = await getPixels(this.hash, this.width, this.height);
        if (imageData) {
          imageData.data.set(pixels);
          ctx?.putImageData(imageData, 0, 0);
        }
      } catch {
        this.validHash = false;
      }
    }
  }
});
</script>
