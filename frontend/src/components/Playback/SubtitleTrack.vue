<template>
  <div
    class="uno-absolute uno-bottom-0 uno-left-0 uno-w-full uno-text-center">
    <span
      class="uno-inline-block uno-pb-10px uno-color-white"
      :class="{ 'stroked': subtitleSettings.state.value.stroke }"
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
import { isNil } from '@jellyfin-vue/shared/validation';
import { subtitleSettings } from '#/store/settings/subtitle';
import { DEFAULT_TYPOGRAPHY } from '#/store/settings/theme';
import { playerElement } from '#/store/player-element';
import type { ParsedSubtitleTrack, Dialogue } from '#/plugins/workers/generic/subtitles';
import { playbackManager } from '#/store/playback-manager';

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
const predicate = (d?: Dialogue) => d && d.start <= playbackManager.currentTime.value && d.end >= playbackManager.currentTime.value;
const findSubtitle = (dialogue: ParsedSubtitleTrack['dialogue'], start = 0) => {
  const index = dialogue.slice(start).findIndex(d => predicate(d));

  return index === -1 ? undefined : index + start;
};

const dialogue = computed(() => playerElement.currentExternalSubtitleTrack.value?.parsed?.dialogue);
const currentSubtitle = computed<{ index: number; sub?: Dialogue } | undefined>((previous) => {
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
  if (subtitleSettings.state.value.fontFamily === 'default') {
    return DEFAULT_TYPOGRAPHY;
  } else if (subtitleSettings.state.value.fontFamily === 'system') {
    return 'system-ui';
  } else if (subtitleSettings.state.value.fontFamily !== 'auto') {
    return subtitleSettings.state.value.fontFamily;
  }
});

/**
 * Computed style for subtitle text element
 * reactive to client subtitle appearance settings
 */
const subtitleStyle = computed<StyleValue>(() => {
  return {
    fontSize: `${subtitleSettings.state.value.fontSize}em`,
    marginBottom: `${subtitleSettings.state.value.positionFromBottom}vh`,
    backgroundColor: subtitleSettings.state.value.backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
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
