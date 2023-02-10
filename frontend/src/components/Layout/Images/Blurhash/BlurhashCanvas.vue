<template>
  <v-fade-transition>
    <canvas
      ref="canvas"
      :key="`canvas-${hash}`"
      :width="width"
      :height="height"
      class="absolute-cover" />
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
const props = withDefaults(
  defineProps<{
    hash: string;
    width?: number;
    height?: number;
    punch?: number;
  }>(),
  { width: 32, height: 32, punch: 1 }
);

const emit = defineEmits<{
  (e: 'error'): void;
}>();

const pixels = ref<Uint8ClampedArray | undefined>(undefined);
const canvas = ref<HTMLCanvasElement | undefined>(undefined);

watch([props, canvas], async () => {
  if (canvas.value) {
    const context = canvas.value.getContext('2d');
    const imageData = context?.createImageData(props.width, props.height);

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

    if (imageData && context) {
      imageData.data.set(pixels.value);
      context.putImageData(imageData, 0, 0);
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
</style>
