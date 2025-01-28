<template>
  <Teleport
    to="head"
    defer>
    <!-- eslint-disable @intlify/vue-i18n/no-raw-text vue/require-component-is -->
    <component
      is="style"
      data-jellyfin-css-vars>
      :root {
      <template v-if="isLoading">
        cursor: progress;
      </template>
      --j-theme-transition-duration: 0.3s;
      --j-theme-color-background: var(--v-theme-background);
      --j-theme-color-menu: var(--v-theme-menu);
      --j-font-family: '{{ typography }}';
      --j-border-opacity: 0.12;
      --j-border-color: 255, 255, 255;
      }
    </component>
    <!-- eslint-enable @intlify/vue-i18n/no-raw-text vue/require-component-is -->
  </Teleport>
  <slot />
</template>

<script setup lang="ts">
/**
 * TODO: Investigate or propose an RFC to allow style tags inside SFCs
 */
import { computed } from 'vue';
import { useLoading } from '#/composables/use-loading';
import { DEFAULT_TYPOGRAPHY } from '#/store';
import { clientSettings } from '#/store/client-settings';

const { isLoading } = useLoading();

const typography = computed(() => {
  if (clientSettings.state.value.typography === 'system') {
    return 'system-ui';
  } else if (clientSettings.state.value.typography === 'default') {
    return DEFAULT_TYPOGRAPHY;
  } else {
    return clientSettings.state.value.typography;
  }
});
</script>
