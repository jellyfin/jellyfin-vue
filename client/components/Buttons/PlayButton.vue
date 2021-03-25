<template>
  <div class="d-inline-flex">
    <v-btn
      v-if="canPlay(items[0]) && fab"
      fab
      color="primary"
      :loading="loading"
      @click.prevent="playOrResume"
    >
      <v-icon size="36">mdi-play</v-icon>
    </v-btn>
    <v-btn
      v-else-if="!fab"
      :disabled="!canPlay(items[0])"
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
          : canResume(items[0])
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
    items: {
      type: Array as () => BaseItemDto[],
      required: true
    },
    fab: {
      type: Boolean
    },
    shuffle: {
      type: Boolean
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
      if (this.status === PlaybackStatus.playing) {
        this.loading = false;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    playOrResume(): void {
      this.loading = true;

      if (this.items.length > 0 && this.canResume(this.items[0])) {
        this.play({
          items: this.items,
          startFromTime:
            this.ticksToMs(this.items[0].UserData?.PlaybackPositionTicks) / 1000
        });
      } else if (this.shuffle) {
        // We force playback from the start when shuffling, since you wouldn't resume AND shuffle at the same time
        this.play({
          items: this.items,
          startShuffled: true
        });
      } else {
        this.play({
          items: this.items
        });
      }
    }
  }
});
</script>
