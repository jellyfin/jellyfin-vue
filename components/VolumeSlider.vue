<template>
  <div class="volume-slider">
    <v-slider
      hide-details
      min="0"
      max="100"
      :value="currentvolume"
      validate-on-blur
      prepend-icon="mdi-volume-high"
      @change="onVolumeChange"
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
    }
  },
  methods: {
    ...mapActions('playbackManager', ['setVolume']),
    onVolumeChange(value: number) {
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
