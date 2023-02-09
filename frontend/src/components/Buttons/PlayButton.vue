<template>
  <div class="d-inline-flex">
    <v-btn
      v-if="canPlay(item) && (fab || iconOnly)"
      :variant="iconOnly ? undefined : 'elevated'"
      :color="iconOnly ? undefined : 'primary'"
      icon
      :loading="loading"
      :disabled="disabled"
      @click.prevent="playOrResume">
      <v-icon v-if="shuffle" :size="fab ? 36 : undefined">
        <i-mdi-shuffle />
      </v-icon>
      <v-icon v-else :size="fab ? 36 : undefined">
        <i-mdi-play />
      </v-icon>
    </v-btn>
    <v-btn
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
          ? $t('playback.shuffle')
          : canResume(item)
          ? $t('resume')
          : $t('play')
      }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { ref } from 'vue';
import { playbackManagerStore } from '@/store';
import { canResume, canPlay } from '@/utils/items';
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
    disabled?: boolean;
  }>(),
  { disabled: false }
);

const playbackManager = playbackManagerStore();

const loading = ref(false);

/** Begins or resumes playing of the item */
async function playOrResume(): Promise<void> {
  loading.value = true;

  if (props.item && canResume(props.item)) {
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex || -1,
      videoTrackIndex: props.videoTrackIndex,
      startFromTime:
        ticksToMs(props.item.UserData?.PlaybackPositionTicks) / 1000
    });
  } else if (props.shuffle) {
    // We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex || -1,
      videoTrackIndex: props.videoTrackIndex,
      startShuffled: true
    });
  } else {
    await playbackManager.play({
      item: props.item,
      audioTrackIndex: props.audioTrackIndex,
      subtitleTrackIndex: props.subtitleTrackIndex || -1,
      videoTrackIndex: props.videoTrackIndex
    });
  }

  loading.value = false;
}
</script>
