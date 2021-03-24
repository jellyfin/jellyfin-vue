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
      :value="currentvolume"
      validate-on-blur
      @input="onVolumeChange"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      previousVolume: 0
    };
  },
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
    },
    toggleMute(): void {
      if (this.currentvolume !== 0) {
        this.previousVolume = this.currentvolume;
        this.setVolume({ volume: 0 });
      } else {
        this.setVolume({ volume: this.previousVolume });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.volume-slider {
  width: 10em;
}

// HACK: https://github.com/vuetifyjs/vuetify/issues/8436.
// https://vuetifyjs.com/en/api/v-btn/#retain-focus-on-click prop was added
// but it seems we're using a prop combination that it's incompatible with it.

// SO link: https://stackoverflow.com/questions/57830767/is-it-default-for-vuetify-to-keep-active-state-on-buttons-after-click-how-do-yo/57831256#57831256
.active-button:focus::before {
  opacity: 0 !important;
}
</style>
