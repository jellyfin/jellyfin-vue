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
    }
  }
});
</script>
