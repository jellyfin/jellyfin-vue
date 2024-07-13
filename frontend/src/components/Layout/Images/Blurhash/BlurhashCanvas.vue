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

<script setup lang="ts">
import { transfer } from 'comlink';
import { shallowRef, watch } from 'vue';
import { blurhashDecoder, canvasDrawer } from '@/plugins/workers';
import { BLURHASH_DEFAULT_HEIGHT, BLURHASH_DEFAULT_WIDTH, BLURHASH_DEFAULT_PUNCH } from '@/store';

const props = withDefaults(
  defineProps<{
    hash: string;
    width?: number;
    height?: number;
    punch?: number;
  }>(),
  { width: BLURHASH_DEFAULT_WIDTH, height: BLURHASH_DEFAULT_HEIGHT, punch: BLURHASH_DEFAULT_PUNCH }
);

const error = shallowRef(false);
const canvas = shallowRef<HTMLCanvasElement>();
let offscreen: OffscreenCanvas | undefined;

watch([props, canvas], async () => {
  const pixels = await blurhashDecoder.getPixels(props.hash, props.width, props.height, props.punch);

  if (canvas.value) {
    if (!offscreen) {
      offscreen = canvas.value.transferControlToOffscreen();
    }

    try {
      error.value = false;
      await canvasDrawer.drawBlurhash(transfer(
        { canvas: offscreen,
          pixels,
          width: props.width,
          height: props.height
        }, [offscreen]));
    } catch {
      error.value = true;

      return;
    }
  } else {
    offscreen = undefined;
  }
});
</script>
