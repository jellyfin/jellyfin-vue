<template>
  <v-btn
    v-if="canPlay(item) && fab"
    fab
    color="primary"
    :loading="loading"
    @click.prevent="playOrResume"
  >
    <v-icon size="36">mdi-play</v-icon>
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
        ? t('playback.shuffle')
        : canResume(item)
        ? t('resume')
        : t('play')
    }}
  </v-btn>
</template>

<script lang="ts">
import type { BaseItemDto } from '@jellyfin/client-axios';
import { noop } from '@vueuse/shared';
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { usePlayback } from '~/composables/playback';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
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
  setup() {
    const { t } = useI18n();

    const loading = ref(false);

    const { canPlay, canResume } = usePlayback();

    const playOrResume = () => {
      noop;
    };

    return { t, loading, canPlay, canResume, playOrResume };
  }
});

/*
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
});*/
</script>
