<template>
  <VFadeTransition>
    <canvas
      ref="canvas"
      :key="`canvas-${hash}`"
      :width="width"
      :height="height"
      class="absolute-cover" />
  </VFadeTransition>
</template>

<script lang="ts">
import { wrap } from 'comlink';
import { ref, shallowRef, watch } from 'vue';
import BlurhashWorker from './BlurhashWorker?worker&inline';
import { remote } from '@/plugins/remote';

const worker = new BlurhashWorker();
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const pixelWorker = wrap<typeof import('./BlurhashWorker')['default']>(worker);

/**
 * Clear cached blurhashes on logout
 */
watch(
  () => remote.auth.currentUser,
  async (newVal) => {
    if (newVal === undefined) {
      await pixelWorker.clearCache();
    }
  }, { flush: 'post' }
);
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
  error: [];
}>();

const pixels = ref<Uint8ClampedArray>();
const canvas = shallowRef<HTMLCanvasElement>();

watch([props, canvas], async () => {
  if (canvas.value) {
    const context = canvas.value.getContext('2d');
    const imageData = context?.createImageData(props.width, props.height);

    try {
      pixels.value = await pixelWorker.getPixels(
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
