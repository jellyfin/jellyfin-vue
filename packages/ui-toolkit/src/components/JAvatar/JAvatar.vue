<template>
  <AvatarRoot
    data-slot="avatar"
    class="j-avatar uno-relative uno-inline-flex uno-shrink-0 uno-items-center uno-justify-center uno-overflow-hidden uno-rounded-full"
    :style="{
      width: normalizedSize,
      height: normalizedSize,
      backgroundColor: color ? `rgba(var(--j-theme-color-${color}))` : undefined,
      color: color ? `var(--j-theme-color-${color}-text)` : undefined
    }"
    v-bind="getBaseProps($attrs)">
    <slot />
  </AvatarRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ColorPalette } from '@jellyfin-vue/configs/uno/colors';
import { AvatarRoot } from 'reka-ui';
import { getBaseProps } from '#/util/props.ts';

defineOptions({
  inheritAttrs: false
});

const { color, size } = defineProps<{
  color?: ColorPalette;
  size?: number;
}>();

const normalizedSize = computed(() => `${size ?? 40}px`);
</script>

<style scoped>
.j-avatar {
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
