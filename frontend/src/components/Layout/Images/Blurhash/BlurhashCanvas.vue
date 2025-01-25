<template>
  <canvas
    v-if="isDocumentVisible && !error"
    ref="canvas"
    v-bind="$attrs"
    :key="`canvas-${hash}`"
    :width="width"
    :height="height" />
  <slot v-else />
</template>

<script setup lang="ts">
import { transfer } from 'comlink';
import { shallowRef, watch, useTemplateRef } from 'vue';
import { computedAsync } from '@vueuse/core';
import { blurhashDecoder, canvasDrawer } from '#/plugins/workers';
import { BLURHASH_DEFAULT_HEIGHT, BLURHASH_DEFAULT_WIDTH, BLURHASH_DEFAULT_PUNCH, isDocumentVisible } from '#/store';

/**
 * Browsers stop canvases when the page is out of view (for example, minimised or in a background tab).
 * We unmount the canvas with `isDocumentVisible` to free resources and ensure the correct appearance when the
 * page is restored.
 */

const { hash, width = BLURHASH_DEFAULT_WIDTH, height = BLURHASH_DEFAULT_HEIGHT, punch = BLURHASH_DEFAULT_PUNCH } = defineProps<{
  hash: string;
  width?: number;
  height?: number;
  punch?: number;
}>();

const error = shallowRef(false);
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
const offscreen = shallowRef<OffscreenCanvas>();
const pixels = computedAsync(async () => await blurhashDecoder.getPixels(hash, width, height, punch));

watch(canvasRef, () => {
  offscreen.value = canvasRef.value ? canvasRef.value.transferControlToOffscreen() : undefined;
});
watch([pixels, offscreen], async () => {
  if (offscreen.value && pixels.value) {
    try {
      error.value = false;
      await canvasDrawer.drawBlurhash(transfer(
        { canvas: offscreen.value,
          pixels: pixels.value,
          width: width,
          height: height
        }, [offscreen.value]));
    } catch {
      error.value = true;

      return;
    }
  }
});
</script>
