<template>
  <VBtn
    icon
    :size="size"
    @click="() => playbackManager.setPreviousItem()"
    @dblclick="() => playbackManager.setPreviousItem(true)">
    <VIcon :size="size">
      <IMdiSkipPrevious />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';
import { playbackManager } from '@/store/playback-manager';

defineProps<{ size?: string }>();
</script>
