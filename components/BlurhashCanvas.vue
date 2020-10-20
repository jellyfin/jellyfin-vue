<template>
  <canvas ref="canvas" :width="width" :height="height" />
</template>

<script lang="ts">
import Vue from 'vue';
import Worker from 'worker-loader!~/plugins/workers/blurhash.worker';
const worker = new Worker();
let pending_canvas: { [id: string]: HTMLCanvasElement } = {};
let computed_hashes: { [id: string]: Uint8ClampedArray } = {};

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
    if (!(this.hash in pending_canvas) && !(this.hash in computed_hashes)) {
      pending_canvas[this.hash] = this.$refs.canvas as HTMLCanvasElement;
      worker.postMessage({
        hash: this.hash,
        width: this.width,
        height: this.height
      });
      worker.onmessage = ({ data }) => {
        this.draw(pending_canvas[data.hash], data.pixels);
        computed_hashes[data.hash] = data.pixels;
        delete pending_canvas[data.hash];
      };
    } else {
      this.draw(
        this.$refs.canvas as HTMLCanvasElement,
        computed_hashes[this.hash]
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
