<template>
  <div class="volume-slider d-flex align-center justify-center">
    <v-btn class="active-button" icon fab small @click="toggleMute">
      <v-icon>{{ icon }}</v-icon>
    </v-btn>
    <v-slider
      class="volume-slider"
      hide-details
      thumb-label
      max="100"
      :value="isMuted ? 0 : currentVolume"
      validate-on-blur
      @input="onVolumeChange"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  data() {
    return {
      previousVolume: 0
    };
  },
  computed: {
    ...mapState('playbackManager', ['currentVolume', 'isMuted']),
    icon(): string {
      if (this.isMuted) {
        return 'mdi-volume-mute';
      } else if (this.currentVolume >= 80) {
        return 'mdi-volume-high';
      } else if (this.currentVolume < 80 && this.currentVolume >= 25) {
        return 'mdi-volume-medium';
      } else if (this.currentVolume < 25 && this.currentVolume >= 1) {
        return 'mdi-volume-low';
      } else {
        return 'mdi-volume-mute';
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['setVolume', 'toggleMute']),
    onVolumeChange(value: number): void {
      this.setVolume({ volume: value });
    }
  }
});
</script>

<style lang="scss" scoped>
.volume-slider {
  width: 10em;
}
</style>
