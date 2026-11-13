<template>
  <div class="uno-inline-flex">
    <VBtn
      v-if="canPlay(item) && (fab || iconOnly)"
      :variant="iconOnly ? undefined : 'elevated'"
      :color="iconOnly ? undefined : 'primary'"
      icon
      :loading="loading || starting"
      :disabled="disabled"
      @click.prevent="playOrResume">
      <JIcon
        v-if="shuffle"
        class="i-mdi-shuffle" />
      <JIcon
        v-else
        class="i-mdi-play" />
    </VBtn>
    <VBtn
      v-else-if="!fab"
      :disabled="disabled || !canPlay(item)"
      :loading="loading || starting"
      class="uno-mr-2"
      color="primary"
      min-width="8em"
      variant="flat"
      @click="playOrResume">
      {{
        shuffle
          ? $t('shuffle')
          : canResume(item)
            ? $t('resume')
            : $t('play')
      }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { ref } from 'vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { canPlay, canResume } from '#/utils/items.ts';
import { ticksToMs } from '#/utils/time.ts';

const {
  item,
  iconOnly,
  fab,
  shuffle,
  videoTrackIndex,
  audioTrackIndex,
  subtitleTrackIndex,
  mediaSourceIndex,
  disabled,
  loading
} = defineProps<{
  item: BaseItemDto;
  iconOnly?: boolean;
  fab?: boolean;
  shuffle?: boolean;
  /**
   * Tracks explicitly chosen for this item, as absolute `MediaStream.Index` values.
   * Leave them undefined to let the server pick the defaults; `-1` disables the subtitles.
   */
  videoTrackIndex?: number;
  audioTrackIndex?: number;
  subtitleTrackIndex?: number;
  /**
   * Version explicitly chosen for this item, as an index in `MediaSources`. Leave it undefined to let the playback
   * manager play the most compatible one.
   */
  mediaSourceIndex?: number;
  disabled?: boolean;
  /**
   * Shows the button as busy, for example while what it would play is still being decided
   */
  loading?: boolean;
}>();

/**
 * Whether the playback it asked for is starting
 */
const starting = ref(false);

/** Begins or resumes playing of the item */
async function playOrResume(): Promise<void> {
  starting.value = true;

  if (canResume(item)) {
    await playbackManager.play({
      item: item,
      audioTrackIndex: audioTrackIndex,
      subtitleTrackIndex: subtitleTrackIndex,
      videoTrackIndex: videoTrackIndex,
      mediaSourceIndex: mediaSourceIndex,
      startFromTime:
        ticksToMs(item.UserData?.PlaybackPositionTicks) / 1000
    });
  } else if (shuffle) {
    // We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
    await playbackManager.play({
      item: item,
      audioTrackIndex: audioTrackIndex,
      subtitleTrackIndex: subtitleTrackIndex,
      videoTrackIndex: videoTrackIndex,
      mediaSourceIndex: mediaSourceIndex,
      startShuffled: true
    });
  } else {
    await playbackManager.play({
      item: item,
      audioTrackIndex: audioTrackIndex,
      subtitleTrackIndex: subtitleTrackIndex,
      videoTrackIndex: videoTrackIndex,
      mediaSourceIndex: mediaSourceIndex
    });
  }

  starting.value = false;
}
</script>
