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
      v-model="mediaVolume"
      class="volume-slider"
      hide-details
      thumb-label
      max="100">
      <template #thumb-label>
        {{ Math.round(mediaVolume) }}
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
import { syncRef, toRef } from '@vueuse/core';
import { playbackManagerStore } from '@/store';

const playbackManager = playbackManagerStore();

const mediaVolumeComputed = computed({
  get: () => playbackManager.mediaCurrentVolume,
  set: (newValue: number) => {
    playbackManager.mediaCurrentVolume = newValue;
  }
});

const remoteVolumeComputed = computed({
  get: () => playbackManager.remoteCurrentVolume,
  set: (newValue: number) => {
    playbackManager.remoteCurrentVolume = newValue;
  }
});

const mediaVolume = toRef(mediaVolumeComputed);
const remoteVolume = toRef(remoteVolumeComputed);

syncRef(mediaVolume, remoteVolume);

const icon = computed(() => {
  if (playbackManager.isMuted) {
    return IMdiVolumeMute;
  } else if (mediaVolume.value >= 80) {
    return IMdiVolumeHigh;
  } else if (mediaVolume.value < 80 && mediaVolume.value >= 25) {
    return IMdiVolumeMedium;
  } else if (mediaVolume.value < 25 && mediaVolume.value >= 1) {
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
