<template>
  <VBtn
    v-bind="$attrs"
    icon
    :disabled="!playbackManager.nextItem.value"
    :aria-label="$t('nextTrack')"
    @click="playbackManager.setNextItem">
    <JIcon
      v-bind="$attrs"
      class="i-mdi:skip-next" />
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager.ts';
</script>
