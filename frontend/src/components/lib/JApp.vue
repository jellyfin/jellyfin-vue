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
        cursor: wait;
      </template>
      --j-color-background: rgb(var(--v-theme-background));
      --j-font-family: '{{ typography }}';
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
import { useLoading } from '@/composables/use-loading';
import { DEFAULT_TYPOGRAPHY } from '@/store';
import { clientSettings } from '@/store/client-settings';

const { isLoading } = useLoading();

const typography = computed(() => {
  if (clientSettings.typography === 'system') {
    return 'system-ui';
  } else if (clientSettings.typography === 'default') {
    return DEFAULT_TYPOGRAPHY;
  } else {
    return clientSettings.typography;
  }
});
</script>
