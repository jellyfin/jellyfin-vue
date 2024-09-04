<template>
  <VBtn
    v-bind="$attrs"
    icon
    :color="playbackManager.isShuffling ? 'primary' : undefined"
    @click="playbackManager.toggleShuffle">
    <VIcon v-bind="$attrs">
      <IMdiShuffle />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playback-manager';
</script>
