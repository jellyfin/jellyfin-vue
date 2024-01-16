<template>
  <VBtn
    icon
    :size="size"
    @click="playbackManager.setPreviousItem">
    <VIcon :size="size">
      <IMdiSkipPrevious />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playbackManager';
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';

defineProps<{ size?: string }>();
</script>
