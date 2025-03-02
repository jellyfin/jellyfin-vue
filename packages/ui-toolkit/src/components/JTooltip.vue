<template>
  <JAnchor
    v-if="$slots.content || text"
    :position
    class="uno-transition-opacity uno-bg-tooltip uno-bg-opacity-80 uno-pointer-events-none uno-rounded uno-text-sm uno-px-2 uno-py-1"
    role="tooltip"
    :class="{
      'uno-opacity-0': !hoverComp?.isHovering,
      'uno-opacity-100': hoverComp?.isHovering,
    }">
    <template #content>
      <slot name="content">
        {{ text }}
      </slot>
    </template>
    <JHover ref="hoverRef">
      <slot />
    </JHover>
  </JAnchor>
  <slot v-else />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import JAnchor from './JAnchor.vue';
import JHover from './JHover.vue';
import type { JAnchorProps } from '#/types';

const { position = 'bottom', text } = defineProps<JAnchorProps & { text?: string }>();
const hoverComp = useTemplateRef('hoverRef');
</script>
