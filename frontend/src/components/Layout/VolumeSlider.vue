<template>
  <div class="d-flex align-center justify-center volume-slider">
    <VBtn
      icon
      size="small"
      @click="playbackManager.toggleMute">
      <VIcon :icon="icon" />
    </VBtn>
    <VSlider
      v-model="playbackManager.currentVolume.value"
      class="volume-slider"
      hide-details
      thumb-label
      max="100">
      <template #thumb-label>
        {{ Math.round(playbackManager.currentVolume.value) }}
      </template>
    </VSlider>
  </div>
</template>

<script setup lang="ts">
import IMdiVolumeHigh from 'virtual:icons/mdi/volume-high';
import IMdiVolumeLow from 'virtual:icons/mdi/volume-low';
import IMdiVolumeMedium from 'virtual:icons/mdi/volume-medium';
import IMdiVolumeMute from 'virtual:icons/mdi/volume-mute';
import { computed } from 'vue';
import { playbackManager } from '#/store/playback-manager';

const icon = computed(() => {
  if (playbackManager.isMuted.value) {
    return IMdiVolumeMute;
  } else if (playbackManager.currentVolume.value >= 80) {
    return IMdiVolumeHigh;
  } else if (
    playbackManager.currentVolume.value < 80
    && playbackManager.currentVolume.value >= 25
  ) {
    return IMdiVolumeMedium;
  } else if (
    playbackManager.currentVolume.value < 25
    && playbackManager.currentVolume.value >= 1
  ) {
    return IMdiVolumeLow;
  } else {
    return IMdiVolumeMute;
  }
});
</script>

<style scoped>
.volume-slider {
  width: 10em;
}
</style>
