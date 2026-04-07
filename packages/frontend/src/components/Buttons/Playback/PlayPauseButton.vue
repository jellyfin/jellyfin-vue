<template>
  <VBtn
    v-bind="$attrs"
    icon
    :loading="playbackManager.isBuffering.value"
    @click.passive="playbackManager.playPause">
    <JIcon
      v-bind="$attrs"
      :class="{
        'i-mdi:exclamation': playbackManager.status.value === PlaybackStatus.Error,
        'i-mdi:play-circle-outline': playbackManager.isPaused.value,
        'i-mdi:pause-circle-outline': !playbackManager.isPaused.value,
      }" />
  </VBtn>
</template>

<script setup lang="ts">
import { PlaybackStatus, playbackManager } from '#/store/playback-manager';
</script>
