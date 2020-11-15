<template>
  <canvas ref="canvas" :width="width" :height="height" />
</template>

<script lang="ts">
import Vue from 'vue';
// eslint-disable-next-line import/no-webpack-loader-syntax, import/default
import Worker from 'worker-loader!~/plugins/workers/blurhash.worker';

const worker = new Worker();
const pendingCanvas: { [id: string]: HTMLCanvasElement } = {};
const computedHashes: { [id: string]: Uint8ClampedArray } = {};

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
  mounted() {
    if (!(this.hash in pendingCanvas) && !(this.hash in computedHashes)) {
      pendingCanvas[this.hash] = this.$refs.canvas as HTMLCanvasElement;
      worker.postMessage({
        hash: this.hash,
        width: this.width,
        height: this.height
      });
      worker.onmessage = ({ data }) => {
        this.draw(pendingCanvas[data.hash], data.pixels);
        computedHashes[data.hash] = data.pixels;
        delete pendingCanvas[data.hash];
      };
    } else {
      this.draw(
        this.$refs.canvas as HTMLCanvasElement,
        computedHashes[this.hash]
      );
    }
  },
  methods: {
    draw(canvas: HTMLCanvasElement, pixels: Uint8ClampedArray) {
      if (pixels) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx?.createImageData(this.width, this.height);
        if (imageData) {
          imageData.data.set(pixels);
          ctx?.putImageData(imageData, 0, 0);
        }
      }
    }
  }
});
</script>
