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
import { wrap, transfer } from 'comlink';
import { shallowRef, watch } from 'vue';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_PUNCH } from './BlurhashWorker';
import BlurhashWorker from './BlurhashWorker?worker';
import { remote } from '@/plugins/remote';

const worker = new BlurhashWorker();
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const blurhashWorker = wrap<typeof import('./BlurhashWorker')['default']>(worker);

/**
 * Clear cached blurhashes on logout
 */
watch(
  () => remote.auth.currentUser,
  async () => {
    if (remote.auth.currentUser === undefined) {
      await blurhashWorker.clearCache();
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

const error = shallowRef(false);
const canvas = shallowRef<HTMLCanvasElement>();
let offscreen: OffscreenCanvas | undefined;

watch([props, canvas], async () => {
  if (canvas.value) {
    if (!offscreen) {
      offscreen = canvas.value.transferControlToOffscreen();
    }

    try {
      error.value = false;
      await blurhashWorker.drawCanvas(transfer(
        { hash: props.hash,
          canvas: offscreen,
          width: props.width,
          height: props.height,
          punch: props.punch
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
