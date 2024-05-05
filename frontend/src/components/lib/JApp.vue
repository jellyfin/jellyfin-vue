<template>
  <Teleport to="head">
    <component is="style" data-jellyfin-css-vars>
      :root {
        <template v-if="isLoading">
          cursor: wait;
        </template>
        --j-background-color: rgb(var(--v-theme-background));
      }
    </component>
  </Teleport>
  <slot />
</template>

<script setup lang="ts">
/**
 * TODO: Investigate or propose an RFC to allow style tags inside SFCs
 */
import { useLoading } from '@/composables/use-loading';

const { isLoading } = useLoading();
</script>
