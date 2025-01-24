<template>
  <VBtn
    v-bind="$attrs"
    icon
    :color="playbackManager.isShuffling.value ? 'primary' : undefined"
    @click="playbackManager.toggleShuffle">
    <JIcon
      v-bind="$attrs"
      class="i-mdi:shuffle" />
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager';
</script>
