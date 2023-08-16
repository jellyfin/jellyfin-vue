<template>
  <VBtn
    class="align-self-center ma-1"
    v-bind="mergeProps($props)"
    icon
    size="small"
    variant="elevated">
    <slot name="icon" />

    <VTooltip
      v-if="$slots.tooltip"
      location="bottom">
      <slot name="tooltip" />
    </VTooltip>
  </VBtn>
</template>

<script setup lang="ts">
import { mergeProps } from 'vue';

withDefaults(
  defineProps<{
    color?: string;
    disabled?: boolean;
  }>(),
  { color: '', disabled: false }
);
</script>
