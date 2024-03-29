<template>
  <canvas
    v-if="!error"
    ref="canvas"
    v-bind="$attrs"
    :key="`canvas-${hash}`"
    :width="width"
    :height="height" />
  <slot v-else />
</template>

<script lang="ts">
import { wrap } from 'comlink';
import { shallowRef, watch } from 'vue';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_PUNCH } from './BlurhashWorker';
import BlurhashWorker from './BlurhashWorker?worker';
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
  { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, punch: DEFAULT_PUNCH }
);

const pixels = shallowRef<Uint8ClampedArray>();
const error = shallowRef(false);
const canvas = shallowRef<HTMLCanvasElement>();

watch([props, canvas], async () => {
  if (canvas.value) {
    const context = canvas.value.getContext('2d');
    const imageData = context?.createImageData(props.width, props.height);

    try {
      error.value = false;
      pixels.value = await pixelWorker.getPixels(
        props.hash,
        props.width,
        props.height,
        props.punch
      );
    } catch {
      pixels.value = undefined;
      error.value = true;

      return;
    }

    if (imageData && context) {
      imageData.data.set(pixels.value);
      context.putImageData(imageData, 0, 0);
    }
  }
});
</script>
