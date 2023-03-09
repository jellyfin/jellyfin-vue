<template>
  <v-btn
    icon
    :size="size"
    :loading="playbackManager.isBuffering"
    @click="playbackManager.playPause">
    <v-icon :size="size" :icon="playPauseIcon" />
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IMdiPauseCircleOutline from 'virtual:icons/mdi/pause-circle-outline';
import IMdiPlayCircleOutline from 'virtual:icons/mdi/play-circle-outline';
import IMdiExclamation from 'virtual:icons/mdi/exclamation';
import { playbackManagerStore } from '@/store';
import { PlaybackStatus } from '@/store/playbackManager';

defineProps<{ size?: string }>();

const playbackManager = playbackManagerStore();

const playPauseIcon = computed(() => {
  if (playbackManager.isPaused) {
    return IMdiPlayCircleOutline;
  } else if (playbackManager.status === PlaybackStatus.Error) {
    return IMdiExclamation;
  }

  return IMdiPauseCircleOutline;
});
</script>
