<template>
    <div
        class="subtitle-track"
        :label="playerElement.currentExternalSubtitleTrack?.label"
        :srclang="playerElement.currentExternalSubtitleTrack?.srcLang"
        :src="playerElement.currentExternalSubtitleTrack?.src" >
        <span
          class="subtitle-track-text"
          v-if="currentSubtitle !== undefined"
          v-html="currentSubtitle.text"
          :style="clientSettings.subtitleStyle">
          </span>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { clientSettings } from '@/store/client-settings';
import { playerElement } from '@/store/player-element'
import { mediaElementRef } from '@/store';

const currentSubtitle = ref(undefined);

/**
 * Function to find the current subtitle based on the current time.
 * It starts searching from the last found index to optimize the search.
 * If not found, it searches from the beginning of the list.
 */
let lastIndex = 0; // Variable to store the last found index of the subtitle
const findCurrentSubtitle = (data, currentTime) => {
  if (!data) return;
  if (!currentTime) return;
  
  // Start searching from the last found index
  for (let i = lastIndex; i < data.length; i++) {
    const subtitle = data[i];

    if (subtitle.start < currentTime && subtitle.end > currentTime) {
      lastIndex = i; // Update the last found index
      return subtitle;
    } else if (subtitle.start > currentTime) {
      break;
    }
  }

  // Start searching from the beginning
  for (let i = 0; i < data.length; i++) {
    const subtitle = data[i];

    if (subtitle.start < currentTime && subtitle.end > currentTime) {
      lastIndex = i; // Update the last found index
      return subtitle;
    } else if (subtitle.start > currentTime) {
      break;
    }
  }
};
/**
 * Function to update the current subtitle based on the current time of the media element.
 */
const updateSubtitle = () => {
  const currentSubtitleTrackData = playerElement.currentExternalSubtitleTrack?.parsed;
  const currentTime = mediaElementRef.value?.currentTime;

  currentSubtitle.value = findCurrentSubtitle(currentSubtitleTrackData, currentTime);
};
/**
 * onMounted lifecycle hook to setup event listeners and initialize the subtitle update mechanism.
 */
onMounted(() => {
  // Add listener to the 'timeupdate' event on the media element to update the subtitle.
  mediaElementRef.value.addEventListener('timeupdate', updateSubtitle);
});
</script>

<style scoped>
.subtitle-track {
	position: absolute;
	text-align: center;
	width: 100%;
  bottom: 0;
}

.subtitle-track-text {
  display: inline-block;
  white-space: break-spaces;
}
</style>
