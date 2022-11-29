<template>
  <div class="volume-slider d-flex align-center justify-center">
    <v-btn
      class="active-button"
      icon
      fab
      size="small"
      @click="playbackManager.toggleMute">
      <Icon>
        {{ icon }}
      </Icon>
    </v-btn>
    <v-slider
      class="volume-slider"
      hide-details
      thumb-label
      max="100"
      :model-value="playbackManager.isMuted ? 0 : playbackManager.currentVolume"
      validate-on="blur"
      @input="onVolumeChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { playbackManagerStore } from '~/store';
import IMdiVolumeMute from '~icons/mdi/volume-mute';
import IMdiVolumeMedium from '~icons/mdi/volume-medium';
import IMdiVolumeHigh from '~icons/mdi/volume-high';
import IMdiVolumeLow from '~icons/mdi/volume-low';

export default defineComponent({
  data() {
    return {
      previousVolume: 0
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    icon(): typeof IMdiVolumeMute {
      if (this.playbackManager.isMuted) {
        return IMdiVolumeMute;
      } else if (this.playbackManager.currentVolume >= 80) {
        return IMdiVolumeHigh;
      } else if (
        this.playbackManager.currentVolume < 80 &&
        this.playbackManager.currentVolume >= 25
      ) {
        return IMdiVolumeMedium;
      } else if (
        this.playbackManager.currentVolume < 25 &&
        this.playbackManager.currentVolume >= 1
      ) {
        return IMdiVolumeLow;
      } else {
        return IMdiVolumeMute;
      }
    }
  },
  methods: {
    onVolumeChange(value: number): void {
      this.playbackManager.setVolume(value);
    }
  }
});
</script>

<style lang="scss" scoped>
.volume-slider {
  width: 10em;
}
</style>
