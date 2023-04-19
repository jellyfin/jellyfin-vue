<template>
  <div class="volume-slider d-flex align-center justify-center">
    <v-btn
      class="active-button"
      icon
      size="small"
      @click="playbackManager.toggleMute">
      <v-icon :icon="icon" />
    </v-btn>
    <v-slider
      v-model="sliderValue"
      class="volume-slider"
      hide-details
      thumb-label
      max="100">
      <template #thumb-label>
        {{ Math.round(sliderValue) }}
      </template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IMdiVolumeMute from 'virtual:icons/mdi/volume-mute';
import IMdiVolumeMedium from 'virtual:icons/mdi/volume-medium';
import IMdiVolumeHigh from 'virtual:icons/mdi/volume-high';
import IMdiVolumeLow from 'virtual:icons/mdi/volume-low';
import { playbackManagerStore } from '@/store';

const playbackManager = playbackManagerStore();

const sliderValue = computed({
  get() {
    return playbackManager.mediaCurrentVolume;
  },
  set(value: number) {
    playbackManager.mediaCurrentVolume = value;
  }
});

const icon = computed(() => {
  if (playbackManager.isMuted) {
    return IMdiVolumeMute;
  } else if (playbackManager.mediaCurrentVolume >= 80) {
    return IMdiVolumeHigh;
  } else if (
    playbackManager.mediaCurrentVolume < 80 &&
    playbackManager.mediaCurrentVolume >= 25
  ) {
    return IMdiVolumeMedium;
  } else if (
    playbackManager.mediaCurrentVolume < 25 &&
    playbackManager.mediaCurrentVolume >= 1
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
