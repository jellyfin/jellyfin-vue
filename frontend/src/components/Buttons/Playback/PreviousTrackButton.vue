<template>
  <VBtn
    icon
    :size="size"
    @click="() => playbackManager.setPreviousItem()">
    <VIcon :size="size">
      <IMdiSkipPrevious />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';
import { playbackManager } from '@/store/playbackManager';

defineProps<{ size?: string }>();
</script>
