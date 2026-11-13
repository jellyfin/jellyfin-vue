<template>
  <div
    class="uno-text-center uno-w-full uno-bottom-0 uno-left-0 uno-absolute">
    <span
      class="uno-color-subtitle uno-pb-10px uno-inline-block"
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
import { subtitleSettings } from '#/store/settings/subtitle.ts';
import { DEFAULT_TYPOGRAPHY } from '#/store/settings/theme.ts';
import { playerElement } from '#/store/player-element.ts';
import type { Dialogue } from '#/plugins/workers/generic/subtitles.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { findCueIndex } from '#/utils/subtitle-cues.ts';

const { preview } = defineProps<{
  /**
   * Whether the subtitle track is in preview mode.
   */
  preview?: boolean;
}>();

const dialogue = computed(() => playerElement.currentParsedSubtitleTrack.value?.dialogue);

/**
 * The cue shown at the current time of the media element (see `findCueIndex`). When none covers the time, the index
 * of the last one shown is kept, so the lookup goes on from it.
 */
const currentSubtitle = computed<undefined | { index: number; sub?: Dialogue }>((previous) => {
  if (isNil(dialogue.value)) {
    return;
  }

  const index = findCueIndex(dialogue.value, playbackManager.currentTime.value, previous?.index);

  if (index === undefined) {
    return isNil(previous) ? undefined : { index: previous.index };
  }

  const sub = dialogue.value[index];

  return previous?.index === index && previous.sub === sub ? previous : { index, sub };
});

const fontFamily = computed(() => {
  if (subtitleSettings.state.value.fontFamily === 'default') {
    return DEFAULT_TYPOGRAPHY;
  }

  if (subtitleSettings.state.value.fontFamily === 'system') {
    return 'system-ui';
  }

  if (subtitleSettings.state.value.fontFamily !== 'auto') {
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
