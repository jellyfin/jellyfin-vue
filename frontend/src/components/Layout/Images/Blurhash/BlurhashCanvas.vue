<template>
  <v-fade-transition>
    <canvas
      ref="canvas"
      :key="`canvas-${hash}`"
      :width="width"
      :height="height"
      class="absolute" />
  </v-fade-transition>
</template>

<script lang="ts">
import { ref, watch } from 'vue';
import { wrap } from 'comlink';
import BlurhashWorker from './BlurhashWorker?worker&inline';

const worker = new BlurhashWorker();
const pixelWorker = wrap<typeof import('./BlurhashWorker')['default']>(worker);
</script>

<script setup lang="ts">
const props = defineProps({
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
});

const emit = defineEmits<{
  (e: 'error'): void;
}>();

const pixels = ref<Uint8ClampedArray | undefined>(undefined);
const canvas = ref<HTMLCanvasElement | undefined>(undefined);

watch([props, canvas], async () => {
  if (canvas.value) {
    try {
      pixels.value = await pixelWorker(
        props.hash,
        props.width,
        props.height,
        props.punch
      );
    } catch {
      pixels.value = undefined;
      emit('error');

      return;
    }

    const context = canvas.value.getContext('2d');
    const imageData = context?.createImageData(props.width, props.height);

    if (imageData) {
      imageData.data.set(pixels.value);
      context?.putImageData(imageData, 0, 0);
    }
  }
});
</script>

<style lang="scss" scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s;
}

.fade-fast-enter,
.fade-fast-leave-to {
  opacity: 0;
}

.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
