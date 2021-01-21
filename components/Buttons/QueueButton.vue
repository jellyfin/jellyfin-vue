<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="false"
    :transition="'slide-y-transition'"
    top
    :nudge-top="35"
    offset-y
    min-width="35vw"
    max-width="35vw"
    min-height="60vh"
    max-height="60vh"
    :z-index="100"
    class="menu"
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
            <v-list-item-subtitle>
              {{ getTotalEndsAtTime(queue) }} -
              {{ $t('playback.queueItems', { items: queue.length }) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <favorite-button :item="item" />
          </v-list-item-action>
          <v-list-item-action class="mr-1">
            <item-menu :item="item" />
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list class="overflow">
        <!-- We set an special property to destroy the element so it doesn't take resources while it's not being used.
        Specially useful for really huge queues -->
        <draggable-queue v-if="menu || !destroy" class="ml-4" />
      </v-list>
      <v-spacer />
      <v-card-actions class="d-flex justify-space-between">
        <v-btn icon fab @click="menu = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-btn disabled color="primary" class="font-weight-medium elevation-2">
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
      menu: false,
      destroy: false
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
  },
  /**
   * We destroy objects 500 ms after the menu has been closed, so they're visible while the transition is taking place
   */
  watch: {
    menu(): void {
      if (!this.menu) {
        setTimeout(() => {
          this.destroy = true;
        }, 500);
      } else {
        this.destroy = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.menu {
  user-select: none;
}

.overflow {
  overflow-y: scroll;
  overflow-x: hidden;
  min-height: 40vh;
  max-height: 40vh;
}
</style>
