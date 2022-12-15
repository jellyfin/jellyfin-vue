<template>
  <div class="volume-slider d-flex align-center justify-center">
    <v-btn
      class="active-button"
      icon
      fab
      size="small"
      @click="playbackManager.toggleMute">
      <v-icon :icon="icon" />
    </v-btn>
    <v-slider
      class="volume-slider"
      hide-details
      thumb-label
      max="100"
      :model-value="playbackManager.isMuted ? 0 : playbackManager.currentVolume"
      validate-on="blur"
      @input="playbackManager.setVolume" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playbackManagerStore } from '~/store';
import IMdiVolumeMute from '~icons/mdi/volume-mute';
import IMdiVolumeMedium from '~icons/mdi/volume-medium';
import IMdiVolumeHigh from '~icons/mdi/volume-high';
import IMdiVolumeLow from '~icons/mdi/volume-low';

const playbackManager = playbackManagerStore();
const icon = computed(() => {
  if (playbackManager.isMuted) {
    return IMdiVolumeMute;
  } else if (playbackManager.currentVolume >= 80) {
    return IMdiVolumeHigh;
  } else if (
    playbackManager.currentVolume < 80 &&
    playbackManager.currentVolume >= 25
  ) {
    return IMdiVolumeMedium;
  } else if (
    playbackManager.currentVolume < 25 &&
    playbackManager.currentVolume >= 1
  ) {
    return IMdiVolumeLow;
  } else {
    return IMdiVolumeMute;
  }
});
</script>

<style lang="scss" scoped>
.volume-slider {
  width: 10em;
}
</style>
