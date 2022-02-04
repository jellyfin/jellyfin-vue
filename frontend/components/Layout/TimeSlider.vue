<template>
  <v-slider
    :value="sliderValue"
    hide-details
    :max="runtime"
    validate-on-blur
    thumb-label
    :step="0"
    class="time-slider"
    @change="onPositionChange"
    @mousedown="onClick"
    @mouseup="onClick"
    @input="onInputChange"
  >
    <template #prepend>
      <span class="mt-1">
        {{ formatTime(currentTime) }}
      </span>
    </template>
    <template #thumb-label>
      {{ formatTime(sliderValue) }}
    </template>
    <template #append>
      <span class="mt-1">
        {{ formatTime(runtime) }}
      </span>
    </template>
  </v-slider>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
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
    ...mapState('playbackManager', ['currentTime']),
    runtime(): number {
      return this.ticksToMs(this.getCurrentItem.RunTimeTicks) / 1000;
    },
    sliderValue: {
      get(): number {
        if (!this.clicked) {
          return this.currentTime;
        }

        return this.currentInput;
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
      this.currentInput = this.currentTime;
      this.clicked = !this.clicked;
    }
  }
});
</script>

<style lang="scss">
.time-slider .v-slider__thumb-container,
.time-slider .v-slider__track-background,
.time-slider .v-slider__track-fill {
  transition: none !important;
}
</style>
