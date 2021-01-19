<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="false"
    transition="slide-y-transition"
    top
    :nudge-top="35"
    offset-y
    min-width="40vw"
    min-height="25vh"
  >
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <v-tooltip top>
        <template #activator="{ on: tooltip }">
          <v-btn icon v-bind="attrs" v-on="{ ...tooltip, ...menu }">
            <v-icon>mdi-playlist-play</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('queue') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-avatar v-if="initiator" tile>
            <blurhash-image :item="initiator" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>{{ sourceText }}</v-list-item-title>
            <v-list-item-subtitle>{{
              getTotalEndsAtTime(queue)
            }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn
              v-if="initiator"
              disabled
              :class="fav ? 'red--text' : ''"
              icon
              @click="fav = !fav"
            >
              <v-icon>mdi-heart</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list class="no-overflow">
        <draggable-queue class="overflow ml-4" />
      </v-list>
      <v-spacer />
      <v-card-actions class="d-flex justify-space-between">
        <v-btn icon fab @click="menu = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-btn color="primary" class="font-weight-medium elevation-2">
          {{ $t('playback.saveAsPlaylist') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { InitMode } from '~/store/playbackManager';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  data() {
    return {
      fav: true,
      menu: false
    };
  },
  computed: {
    queue: {
      get(): BaseItemDto[] {
        return this.$store.state.playbackManager.queue;
      }
    },
    initiator: {
      get(): BaseItemDto | null {
        return this.$store.state.playbackManager.playbackInitiator;
      }
    },
    sourceText: {
      get(): string {
        switch (this.$store.state.playbackManager.playbackInitMode) {
          case InitMode.Unknown:
            return this.$t('playback.playbackSource.unknown');
          case InitMode.Item:
            return this.$t('playback.playbackSource.item', {
              item: this.initiator?.Name
            });
          case InitMode.Shuffle:
            return this.$t('playback.playbackSource.shuffle');
          case InitMode.ShuffleItem:
            return this.$t('playback.playbackSource.shuffleItem', {
              item: this.initiator?.Name
            });
          default:
            return '';
        }
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.overflow {
  overflow-y: scroll;
  overflow-x: hidden;
  min-height: 30vh;
  max-height: 45vh;
}
.no-overflow {
  overflow: hidden;
}
</style>
