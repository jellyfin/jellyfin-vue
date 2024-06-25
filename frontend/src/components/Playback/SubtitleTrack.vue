<template>
    <div
        class="uno-absolute uno-text-center uno-w-full uno-bottom-0 uno-left-0"
        :label="playerElement.currentExternalSubtitleTrack?.label"
        :srclang="playerElement.currentExternalSubtitleTrack?.srcLang"
        :src="playerElement.currentExternalSubtitleTrack?.src" >
        <span
          class="uno-inline-block"
          :style="subtitleStyle">
          <JSafeHtml
          v-if="currentSubtitle !== undefined"
          :html="currentSubtitle.text" />
          {{ previewText }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { clientSettings } from '@/store/client-settings';
import { mediaControls } from '@/store';
import { playerElement } from '@/store/player-element';
import { isNil } from '@/utils/validation';
import type { ParsedSubtitleTrack } from '@/utils/subtitles';

defineProps<{
  previewText?: string;
}>();

/**
 * Function to find the current subtitle based on the current time.
 * It starts searching from the last found index to optimize the search.
 * If not found, it searches from the beginning of the list.
 */
let lastIndex = 0; // Variable to store the last found index of the subtitle
const findCurrentSubtitle = (data: ParsedSubtitleTrack, currentTime: number) => {
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
  for (const [i, subtitle] of data.entries()) {
    if (subtitle.start < currentTime && subtitle.end > currentTime) {
      lastIndex = i; // Update the last found index
      return subtitle;
    } else if (subtitle.start > currentTime) {
      break;
    }
  }
};
/**
 * Update the current subtitle based on the current time of the media element.
 */
const currentSubtitle = computed(() =>
  !isNil(mediaControls.currentTime.value)
  && !isNil(playerElement.currentExternalSubtitleTrack?.parsed)
    ? findCurrentSubtitle(playerElement.currentExternalSubtitleTrack.parsed, mediaControls.currentTime.value)
    : undefined
);
/**
 * Computed style for subtitle text element
 * reactive to client subtitle appearance settings
 */
const subtitleStyle = computed(() => {
  const subtitleAppearance = clientSettings.subtitleAppearance;

  return {
    fontFamily: `${subtitleAppearance.fontFamily} !important`,
    fontSize: `${subtitleAppearance.fontSize}em`,
    marginBottom: `${subtitleAppearance.positionFromBottom}vh`,
    backgroundColor: subtitleAppearance.backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    padding: '10px',
    color: 'white',
    /**
     * Unwrap stroke style if stroke is enabled
     */
    ...(subtitleAppearance.stroke && {
      TextStrokeColor: 'black',
      TextStrokeWidth: '7px',
      textShadow: '2px 2px 15px black',
      paintOrder: 'stroke fill'
    })
  };
});
</script>
