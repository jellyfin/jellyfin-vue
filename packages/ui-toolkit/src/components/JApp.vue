<template>
  <Teleport
    to="head"
    defer>
    <!-- eslint-disable vue/require-component-is vue/html-indent -->
    <component
      is="style"
      data-jellyfin-css-vars>
      :root {
      <template v-if="loading">
        cursor: progress;
      </template>
      <template v-for="(value, key) in currentColors">
        --j-theme-color-{{ key }}: {{ Color(value).rgb().array().join(', ') }};
        --j-theme-color-{{ key }}-text: lch(from rgb(var(--j-theme-color-{{ key }})) calc((49.44 - l) * infinity) 0 0);
      </template>
        --j-font-family: '{{ theme.typography }}';
        --j-theme-transition-duration: {{ theme.transitionDuration }}s;
        --j-border-opacity: 0.12;
        --j-border-color: 255, 255, 255;
        color-scheme: {{ theme.isDark ? 'dark' : 'light' }} only;
        color: var(--j-theme-color-background-text);
      }
    </component>
    <!-- eslint-enable vue/require-component-is vue/html-indent -->
  </Teleport>
  <slot />
</template>

<script setup lang="ts">
/**
 * TODO: Investigate or propose an RFC to allow style tags inside SFCs
 */
/**
 * The text color is calculated using: https://codepen.io/devongovett/pen/QwLbRrW and https://x.com/devongovett/status/1863733091409461256
 */
import { computed } from 'vue';
import type { ColorPalette } from '@jellyfin-vue/shared/colors';
import { watchImmediate } from '@vueuse/core';
import Color from 'color';

const { theme, loading } = defineProps<{
  theme: {
    isDark?: boolean;
    colors: {
      dark: Record<ColorPalette, string>;
      light: Record<ColorPalette, string>;
    };
    typography: string;
    transitionDuration: number;
  };
  loading: boolean;
}>();

const currentColors = computed(() => theme.colors[theme.isDark ? 'dark' : 'light']);

watchImmediate(() => theme.isDark, () => {
  document.body.classList.toggle('dark', theme.isDark);
});
</script>
