<template>
  <div class="d-inline-flex">
    <v-btn
      v-if="canPlay(item) && (fab || iconOnly)"
      :variant="iconOnly ? 'text' : undefined"
      :color="iconOnly ? undefined : 'primary'"
      :loading="loading"
      :disabled="disabled"
      @click.prevent="playOrResume">
      <v-icon v-if="shuffle" :size="fab ? 36 : null">
        <i-mdi-shuffle />
      </v-icon>
      <v-icon v-else :size="fab ? 36 : null">
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
      rounded
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

<script lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { defineComponent } from 'vue';
import { playbackManagerStore } from '@/store';
import { canResume, canPlay } from '@/utils/items';
import { ticksToMs } from '@/utils/time';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    iconOnly: {
      type: Boolean
    },
    fab: {
      type: Boolean
    },
    shuffle: {
      type: Boolean
    },
    videoTrackIndex: {
      type: Number,
      default: undefined
    },
    audioTrackIndex: {
      type: Number,
      default: undefined
    },
    subtitleTrackIndex: {
      type: Number,
      default: undefined
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const playbackManager = playbackManagerStore();

    return { playbackManager };
  },
  data() {
    return {
      loading: false
    };
  },
  methods: {
    async playOrResume(): Promise<void> {
      this.loading = true;

      if (this.item && canResume(this.item)) {
        await this.playbackManager.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex,
          startFromTime:
            ticksToMs(this.item.UserData?.PlaybackPositionTicks) / 1000
        });
      } else if (this.shuffle) {
        /**
         * We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
         */
        await this.playbackManager.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex,
          startShuffled: true
        });
      } else {
        await this.playbackManager.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex
        });
      }

      this.loading = false;
    },
    canPlay,
    canResume
  }
});
</script>
