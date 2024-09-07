<template>
  <div
    class="uno-absolute uno-bottom-0 uno-left-0 uno-w-full uno-text-center"
    :label="playerElement.currentExternalSubtitleTrack?.label"
    :srclang="playerElement.currentExternalSubtitleTrack?.srcLang"
    :src="playerElement.currentExternalSubtitleTrack?.src">
    <span
      class="uno-inline-block uno-pb-10px uno-color-white"
      :class="{ 'stroked': subtitleSettings.state.stroke }"
      :style="subtitleStyle">
      <template v-if="preview">
        {{ $t('subtitlePreviewText') }}
      </template>
      <JSafeHtml
        v-else-if="currentSubtitle !== undefined"
        :html="currentSubtitle.text" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';
import { DEFAULT_TYPOGRAPHY, mediaControls } from '@/store';
import { playerElement } from '@/store/player-element';
import { isNil } from '@/utils/validation';
import type { ParsedSubtitleTrack } from '@/utils/subtitles';

const { preview } = defineProps<{
  /**
   * Whether the subtitle track is in preview mode.
   */
  preview?: boolean;
}>();

/**
 * Function to find the current subtitle based on the current time.
 * It starts searching from the last found index to optimize the search.
 * If not found, it searches from the beginning of the list.
 */
let lastIndex = 0; // Variable to store the last found index of the subtitle
const findCurrentSubtitle = (data: ParsedSubtitleTrack, currentTime: number) => {
  // Start searching from the last found index
  for (let i = lastIndex; i < data.dialogue.length; i++) {
    const subtitle = data.dialogue[i];

    if (subtitle.start < currentTime && subtitle.end > currentTime) {
      lastIndex = i; // Update the last found index

      return subtitle;
    } else if (subtitle.start > currentTime) {
      break;
    }
  }

  // Start searching from the beginning
  for (const [i, subtitle] of data.dialogue.entries()) {
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

const fontFamily = computed(() => {
  if (subtitleSettings.state.fontFamily === 'default') {
    return DEFAULT_TYPOGRAPHY;
  } else if (subtitleSettings.state.fontFamily === 'system') {
    return 'system-ui';
  } else if (subtitleSettings.state.fontFamily !== 'auto') {
    return subtitleSettings.state.fontFamily;
  }
});

/**
 * Computed style for subtitle text element
 * reactive to client subtitle appearance settings
 */
const subtitleStyle = computed<StyleValue>(() => {
  const subtitleAppearance = subtitleSettings.state;

  return {
    fontSize: `${subtitleAppearance.fontSize}em`,
    marginBottom: `${subtitleAppearance.positionFromBottom}vh`,
    backgroundColor: subtitleAppearance.backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    /**
     * Unwrap font family and stroke style if stroke is enabled
     */
    ...(fontFamily.value && {
      fontFamily: `${fontFamily.value} !important`
    })
  };
});
</script>

<style scoped>
.stroked {
  --webkit-text-stroke-color: black;
  --webkit-text-stroke-width: 7px;
  text-shadow: 2px 2px 15px black;
  paint-order: stroke fill;
}
</style>
