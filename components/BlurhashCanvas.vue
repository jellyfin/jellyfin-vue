<template>
  <canvas ref="canvas" :width="width" :height="height" />
</template>

<script lang="ts">
import Vue from 'vue';
import Worker from 'worker-loader!./blurhash.worker';
const worker = new Worker();

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
    draw() {
      const bhash_data = {
        hash: this.hash,
        width: this.width,
        height: this.height
      };
      worker.postMessage(bhash_data);
      const ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d');
      const imageData = ctx?.createImageData(this.width, this.height);
      worker.onmessage = ({ data }) => {
        const pixels = data;
        if (pixels && imageData) {
          imageData.data.set(pixels);
          ctx?.putImageData(imageData, 0, 0);
        }
      };
    }
  }
});
</script>
