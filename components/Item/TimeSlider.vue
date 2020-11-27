<template>
  <v-slider
    min="0"
    :max="runtime"
    validate-on-blur
    :step="0"
    :value="sliderValue"
    hide-details
    thumb-label
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
    sliderValue: {
      get(): number {
        if (!this.clicked) {
          return this.$store.state.playbackManager.currentTime;
        }
        return this.currentInput;
      }
    },
    runtime(): number {
      return this.ticksToMs(this.getCurrentItem.RunTimeTicks) / 1000;
    },
    realPosition: {
      get(): number {
        return this.$store.state.playbackManager.currentTime;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['changeCurrentTime']),
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
    },
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
    }
  }
});
</script>
