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
import { blurhashDrawer } from '#/plugins/workers';
import { BLURHASH_DEFAULT_HEIGHT, BLURHASH_DEFAULT_WIDTH, BLURHASH_DEFAULT_PUNCH, isDocumentVisible } from '#/store';

/**
 * Browsers stop canvases when the page is out of view (for example, minimised or in a background tab).
 * We unmount the canvas with `isDocumentVisible` to free resources and ensure the correct appearance when the
 * page is restored.
 */

const { hash,
  width = BLURHASH_DEFAULT_WIDTH,
  height = BLURHASH_DEFAULT_HEIGHT,
  punch = BLURHASH_DEFAULT_PUNCH
} = defineProps<{
  hash: string;
  width?: number;
  height?: number;
  punch?: number;
}>();

const error = shallowRef(false);
const canvasRef = useTemplateRef('canvas');

watch(canvasRef, async () => {
  if (canvasRef.value) {
    error.value = false;

    try {
      const offscreen = canvasRef.value.transferControlToOffscreen();

      await blurhashDrawer.draw(transfer(
        { canvas: offscreen,
          hash: hash,
          width: width,
          height: height,
          punch: punch
        }, [offscreen]));
    } catch {
      error.value = true;
    }
  }
});
</script>
