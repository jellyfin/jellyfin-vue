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
        {{ formatTime(realPosition) }}
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
