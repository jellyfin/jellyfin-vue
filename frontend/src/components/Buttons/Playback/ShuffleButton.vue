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
import { playbackManager } from '@/store/playback-manager';

defineProps<{ size?: string }>();
</script>
