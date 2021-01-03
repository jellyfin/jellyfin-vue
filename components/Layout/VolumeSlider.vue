<template>
  <div class="volume-slider">
    <v-slider
      hide-details
      thumb-label
      max="100"
      :value="currentvolume"
      validate-on-blur
      :prepend-icon="icon"
      @input="onVolumeChange"
    >
    </v-slider>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  computed: {
    currentvolume(): number {
      return this.$store.state.playbackManager.currentVolume;
    },
    icon(): string {
      if (this.currentvolume >= 80) {
        return 'mdi-volume-high';
      } else if (this.currentvolume < 80 && this.currentvolume >= 25) {
        return 'mdi-volume-medium';
      } else if (this.currentvolume < 25 && this.currentvolume >= 1) {
        return 'mdi-volume-low';
      } else {
        return 'mdi-volume-mute';
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['setVolume']),
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
