<template>
  <div class="volume-slider d-flex align-center justify-center">
    <v-btn
      class="active-button"
      icon
      fab
      small
      @click="playbackManager.toggleMute">
      <v-icon>{{ icon }}</v-icon>
    </v-btn>
    <v-slider
      class="volume-slider"
      hide-details
      thumb-label
      max="100"
      :value="playbackManager.isMuted ? 0 : playbackManager.currentVolume"
      validate-on-blur
      @input="onVolumeChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { playbackManagerStore } from '~/store';

export default defineComponent({
  data() {
    return {
      previousVolume: 0
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    icon(): string {
      if (this.playbackManager.isMuted) {
        return 'mdi-volume-mute';
      } else if (this.playbackManager.currentVolume >= 80) {
        return 'mdi-volume-high';
      } else if (
        this.playbackManager.currentVolume < 80 &&
        this.playbackManager.currentVolume >= 25
      ) {
        return 'mdi-volume-medium';
      } else if (
        this.playbackManager.currentVolume < 25 &&
        this.playbackManager.currentVolume >= 1
      ) {
        return 'mdi-volume-low';
      } else {
        return 'mdi-volume-mute';
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
