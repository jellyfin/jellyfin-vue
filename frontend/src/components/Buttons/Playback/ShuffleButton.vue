<template>
  <VBtn
    icon
    :size="size"
    :color="playbackManager.isShuffling ? 'primary' : undefined"
    @click="playbackManager.toggleShuffle">
    <VIcon :size="size">
      <IMdiShuffle />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playbackManager';

defineProps<{ size?: string }>();
</script>
