<template>
  <VBtn
    v-bind="$attrs"
    icon
    :disabled="!playbackManager.nextItem"
    @click="playbackManager.setNextItem">
    <VIcon v-bind="$attrs">
      <IMdiSkipNext />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playback-manager';
</script>
