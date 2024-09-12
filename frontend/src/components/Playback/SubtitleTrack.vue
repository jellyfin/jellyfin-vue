<template>
  <div
    class="uno-absolute uno-bottom-0 uno-left-0 uno-w-full uno-text-center">
    <span
      class="uno-inline-block uno-pb-10px uno-color-white"
      :class="{ 'stroked': subtitleSettings.state.stroke }"
      :style="subtitleStyle">
      <template v-if="preview">
        {{ $t('subtitlePreviewText') }}
      </template>
      <JSafeHtml
        v-else-if="!isNil(currentSubtitle?.sub)"
        :html="currentSubtitle.sub.text" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';
import { DEFAULT_TYPOGRAPHY } from '@/store';
import { playerElement } from '@/store/player-element';
import { isNil } from '@/utils/validation';
import type { ParsedSubtitleTrack, Dialogue } from '@/plugins/workers/generic/subtitles';
import { playbackManager } from '@/store/playback-manager';

const { preview } = defineProps<{
  /**
   * Whether the subtitle track is in preview mode.
   */
  preview?: boolean;
}>();

/**
 * Update the current subtitle based on the current time of the media element.
 *
 * Loops in the first run (we can't assume that the first run will appear at index 0,
 * since the user can seek to any position) when 'previous' is undefined and then relies in previous
 * to find the next one
 */
const predicate = (d: Dialogue) => d.start <= playbackManager.currentTime && d.end >= playbackManager.currentTime;
const findSubtitle = (dialogue: ParsedSubtitleTrack['dialogue'], start = 0) => {
  const index = dialogue.slice(start).findIndex(d => predicate(d));

  return index === -1 ? undefined : index + start;
};

const dialogue = computed(() => playerElement.currentExternalSubtitleTrack?.parsed?.dialogue);
const currentSubtitle = computed<{ index: number; sub?: Dialogue | undefined } | undefined>((previous) => {
  if (!isNil(dialogue.value)) {
    const hasPrevious = !isNil(previous);
    const nextIndex = hasPrevious ? previous.index + 1 : 0;
    const isNext = hasPrevious && predicate(dialogue.value[nextIndex]);
    const isCurrent = hasPrevious && predicate(dialogue.value[previous.index]);

    if (isCurrent) {
      return previous;
    } else {
      const newIndex = isNext ? nextIndex : findSubtitle(dialogue.value, nextIndex);

      if (!isNil(newIndex)) {
        return { index: newIndex, sub: dialogue.value[newIndex] };
      } else if (hasPrevious) {
        return { index: previous.index };
      }
    }
  }
});

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
  -webkit-text-stroke: 7px black;
  text-shadow: 2px 2px 15px black;
  paint-order: stroke fill;
}
</style>
