<template>
  <v-slider
    :value="sliderValue"
    hide-details
    :max="runtime"
    validate-on-blur
    thumb-label
    :step="0"
    @end="onPositionChange"
    @change="onPositionChange"
    @mousedown="onClick"
    @mouseup="onClick"
    @input="onInputChange"
  >
    <template #prepend>
      <span class="mt-1">
        {{ getRuntime(realPosition) }}
      </span>
    </template>
    <template #thumb-label>
      {{ getRuntime(sliderValue) }}
    </template>
    <template #append>
      <span class="mt-1">
        {{ getRuntime(runtime) }}
      </span>
    </template>
  </v-slider>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  data() {
    return {
      clicked: false,
      currentInput: 0
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    runtime(): number {
      return this.ticksToMs(this.getCurrentItem.RunTimeTicks) / 1000;
    },
    sliderValue: {
      get(): number {
        if (!this.clicked) {
          return this.$store.state.playbackManager.currentTime;
        }
        return this.currentInput;
      }
    },
    realPosition: {
      get(): number {
        return this.$store.state.playbackManager.currentTime;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['changeCurrentTime']),
    getRuntime(seconds: number): string {
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds - minutes * 60);

      /**
       * Formats the second number
       * E.g. 7 -> 07
       *
       * @param {string} seconds - Number to format
       * @returns {string} Formatted seconds number
       */
      function formatSeconds(seconds: string): string {
        return ('0' + seconds).slice(-2);
      }

      return `${minutes}:${formatSeconds(seconds.toString())}`;
    },
    onPositionChange(value: number): void {
      if (!this.clicked) {
        this.changeCurrentTime({ time: value });
      }
    },
    onInputChange(value: number): void {
      this.currentInput = value;
    },
    onClick(): void {
      this.currentInput = this.realPosition;
      this.clicked = !this.clicked;
    }
  }
});
</script>

<style lang="scss" scoped>
.v-input >>> .v-slider__thumb-container,
.v-input >>> .v-slider__track-background,
.v-input >>> .v-slider__track-fill {
  transition: none !important;
}
</style>
