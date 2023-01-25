<template>
  <v-slider
    v-model="sliderValue"
    hide-details
    :max="runtime"
    thumb-label
    @mouseup="releaseMouse"
    @mousedown="clicked = true">
    <template #prepend>
      {{ formatTime(playbackManager.currentTime) }}
    </template>
    <template #thumb-label>
      {{ formatTime(sliderValue) }}
    </template>
    <template #append>
      {{ formatTime(runtime) }}
    </template>
  </v-slider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { playbackManagerStore } from '@/store';
import { ticksToMs, formatTime } from '@/utils/time';

const playbackManager = playbackManagerStore();
const currentInput = ref(0);
const clicked = ref(false);
const runtime = computed(() => {
  return ticksToMs(playbackManager.currentItem?.RunTimeTicks) / 1000;
});
const sliderValue = computed({
  get() {
    return clicked.value ? currentInput.value : playbackManager.currentTime;
  },
  set(newValue) {
    currentInput.value = newValue;
  }
});

/**
 * onMouseUp event handler
 *
 * Once the user releases the slider, change the time of the playbackManager with whatever
 * input value was provided by the user
 */
function releaseMouse(): void {
  playbackManager.currentTime = currentInput.value;
  clicked.value = false;
}
</script>
