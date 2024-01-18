<template>
  <div class="d-inline-flex">
    <VBtn
      v-if="canPlay(item) && (fab || iconOnly)"
      :variant="iconOnly ? undefined : 'elevated'"
      :color="iconOnly ? undefined : 'primary'"
      icon
      :loading="loading"
      :disabled="disabled"
      @click.prevent="playOrResume">
      <VIcon
        v-if="shuffle"
        :size="fab ? 36 : undefined">
        <IMdiShuffle />
      </VIcon>
      <VIcon
        v-else
        :size="fab ? 36 : undefined">
        <IMdiPlay />
      </VIcon>
    </VBtn>
    <VBtn
      v-else-if="!fab"
      :disabled="disabled || !canPlay(item)"
      :loading="loading"
      class="mr-2"
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
import { playbackManager } from '@/store/playbackManager';
import { canPlay, canResume } from '@/utils/items';
import { ticksToMs } from '@/utils/time';

const props = withDefaults(
  defineProps<{
    item: BaseItemDto;
    iconOnly?: boolean;
    fab?: boolean;
    shuffle?: boolean;
    videoTrackIndex?: number;
    audioTrackIndex?: number;
    subtitleTrackIndex?: number;
    mediaSourceIndex?: number;
    disabled?: boolean;
  }>(),
  {
    iconOnly: false,
    fab: false,
    shuffle: false,
    disabled: false,
    videoTrackIndex: undefined,
    audioTrackIndex: undefined,
    subtitleTrackIndex: undefined,
    mediaSourceIndex: undefined
  }
);

const loading = ref(false);

/** Begins or resumes playing of the item */
async function playOrResume(): Promise<void> {
  loading.value = true;

  if (props.item && canResume(props.item)) {
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex,
      videoTrackIndex: props.videoTrackIndex,
      mediaSourceIndex: props.mediaSourceIndex,
      startFromTime:
        ticksToMs(props.item.UserData?.PlaybackPositionTicks) / 1000
    });
  } else if (props.shuffle) {
    // We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex,
      videoTrackIndex: props.videoTrackIndex,
      mediaSourceIndex: props.mediaSourceIndex,
      startShuffled: true
    });
  } else {
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex,
      videoTrackIndex: props.videoTrackIndex,
      mediaSourceIndex: props.mediaSourceIndex
    });
  }

  loading.value = false;
}
</script>
