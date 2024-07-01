<template>
  <VBtn
    icon
    :size="size"
    :loading="playbackManager.isBuffering"
    @click="(e: MouseEvent) => {
      if ('pointerType' in e && e.pointerType) {
        playbackManager.playPause()
      }
    }">
    <VIcon
      :size="size"
      :icon="playPauseIcon" />
  </VBtn>
</template>

<script setup lang="ts">
/**
 * - Reason behind pointer checks: https://github.com/jellyfin/jellyfin-vue/issues/2353
 */
import IMdiExclamation from 'virtual:icons/mdi/exclamation';
import IMdiPauseCircleOutline from 'virtual:icons/mdi/pause-circle-outline';
import IMdiPlayCircleOutline from 'virtual:icons/mdi/play-circle-outline';
import { computed } from 'vue';
import { PlaybackStatus, playbackManager } from '@/store/playback-manager';

defineProps<{ size?: string }>();

const playPauseIcon = computed(() => {
  if (playbackManager.isPaused) {
    return IMdiPlayCircleOutline;
  } else if (playbackManager.status === PlaybackStatus.Error) {
    return IMdiExclamation;
  }

  return IMdiPauseCircleOutline;
});
</script>
