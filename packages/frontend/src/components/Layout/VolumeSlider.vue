<template>
  <div class="d-flex align-center justify-center volume-slider">
    <VBtn
      icon
      size="small"
      @click="playbackManager.toggleMute">
      <JIcon :class="icon" />
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
import { computed } from 'vue';
import { playbackManager } from '#/store/playback-manager';

const icon = computed(() => {
  const volume = playbackManager.currentVolume.value;

  switch (true) {
    case volume >= 80: {
      return 'i-mdi:volume-high';
    }
    case volume >= 25: {
      return 'i-mdi:volume-medium';
    }
    case volume >= 1: {
      return 'i-mdi:volume-mute';
    }
    default: {
      return 'i-mdi:volume-mute';
    }
  }
});
</script>

<style scoped>
.volume-slider {
  width: 10em;
}
</style>
