<template>
  <div class="d-inline-flex">
    <v-btn
      v-if="canPlay(item) && (fab || iconOnly)"
      :fab="fab"
      :text="iconOnly"
      :color="iconOnly ? null : 'primary'"
      :loading="loading"
      @click.prevent="playOrResume"
    >
      <v-icon v-if="shuffle" :size="fab ? 36 : null">mdi-shuffle</v-icon>
      <v-icon v-else :size="fab ? 36 : null">mdi-play</v-icon>
    </v-btn>
    <v-btn
      v-else-if="!fab"
      :disabled="!canPlay(item)"
      :loading="loading"
      class="mr-2"
      color="primary"
      min-width="8em"
      depressed
      rounded
      @click="playOrResume"
    >
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
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import itemHelper from '~/mixins/itemHelper';
import timeUtils from '~/mixins/timeUtils';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  mixins: [itemHelper, timeUtils],
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
    }
  },
  data() {
    return {
      loading: false
    };
  },
  computed: {
    ...mapState('playbackManager', ['status'])
  },
  watch: {
    status(): void {
      if (this.status === PlaybackStatus.Playing) {
        this.loading = false;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    playOrResume(): void {
      this.loading = true;

      if (this.item && this.canResume(this.item)) {
        this.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex,
          startFromTime:
            this.ticksToMs(this.item.UserData?.PlaybackPositionTicks) / 1000
        });
      } else if (this.shuffle) {
        // We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
        this.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex,
          startShuffled: true
        });
      } else {
        this.play({
          item: this.item,
          audioTrackIndex: this.audioTrackIndex,
          subtitleTrackIndex: this.subtitleTrackIndex || -1,
          videoTrackIndex: this.videoTrackIndex
        });
      }
    }
  }
});
</script>
