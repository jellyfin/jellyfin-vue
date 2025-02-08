<template>
  <JSlot
    :style="{
      'anchor-name': anchorName,
    }">
    <slot />
  </JSlot>
  <span
    class="uno-absolute uno-z-1500 anchor-target"
    :style="{
      // @ts-expect-error - The API is not common yet
      'position-anchor': anchorName,
      // eslint-disable-next-line css/no-unknown-property
      'position-area': position ?? 'bottom span-all',
    }"
    v-bind="$attrs">
    <slot name="content" />
  </span>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import JSlot from './JSlot.vue';
import type { JAnchorProps } from '#/types';

const { position } = defineProps<JAnchorProps>();
const anchorName = `--${useId()}`;
</script>

<style scoped>
.anchor-target {
  position-visibility: anchors-visible;
  position-try-fallbacks: flip-block flip-inline, top, right, bottom, left;
}
</style>
