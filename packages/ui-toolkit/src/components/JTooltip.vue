<template>
  <JAnchor
    v-if="$slots.content || text"
    :position
    :open="hoverComp?.isHovering && !pressed"
    :offset="10"
    class="uno-bg-tooltip/80 uno-pointer-events-none uno-rounded-sm uno-text-sm uno-px-2 uno-py-1"
    role="tooltip">
    <template #content>
      <slot name="content">
        {{ text }}
      </slot>
    </template>
    <JHover ref="hoverRef">
      <JSlot @pointerdown.passive="pressed = true">
        <slot />
      </JSlot>
    </JHover>
  </JAnchor>
  <slot v-else />
</template>

<script setup lang="ts">
import { shallowRef, useTemplateRef, watch } from 'vue';
import JAnchor from './JAnchor.vue';
import JHover from './JHover.vue';
import JSlot from './JSlot.vue';
import type { JAnchorProps } from '#/types.d.ts';

const { position = 'bottom', text } = defineProps<Pick<JAnchorProps, 'position'> & { text?: string }>();
const hoverComp = useTemplateRef('hoverRef');
/**
 * Tooltips are rendered in the top layer, above any other overlay. Once the activator is pressed,
 * the tooltip is hidden until the pointer leaves it, so it doesn't cover what the activator opens (like menus)
 */
const pressed = shallowRef(false);

watch(() => hoverComp.value?.isHovering, (isHovering) => {
  if (!isHovering) {
    pressed.value = false;
  }
});
</script>
