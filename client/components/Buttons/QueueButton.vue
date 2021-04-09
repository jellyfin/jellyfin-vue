<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="closeOnClick"
    :transition="'slide-y-transition'"
    top
    :nudge-top="nudgeTop"
    offset-y
    min-width="35vw"
    max-width="35vw"
    min-height="60vh"
    max-height="60vh"
    :z-index="500"
    class="menu"
    @input="$emit('input', $event)"
  >
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <v-tooltip top>
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            icon
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>mdi-playlist-play</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('queue') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-avatar tile>
            <blurhash-image v-if="initiator" :item="initiator" />
            <v-icon v-else>{{ modeIcon }}</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>{{ sourceText }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ getTotalEndsAtTime(queue) }} -
              {{ $t('playback.queueItems', { items: queue.length }) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <like-button v-if="initiator" :item="getCurrentItem" />
          </v-list-item-action>
          <v-list-item-action class="mr-1">
            <item-menu v-if="initiator" :item="getCurrentItem" />
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list class="overflow">
        <!-- We set an special property to destroy the element so it doesn't take resources while it's not being used.
        This is especially useful for really huge queues. -->
        <draggable-queue v-if="menu || !destroy" class="ml-4" />
      </v-list>
      <v-spacer />
      <v-card-actions class="d-flex justify-space-between">
        <v-tooltip top>
          <template #activator="{ on: tooltip }">
            <v-btn icon v-on="tooltip" @click="stop">
              <v-icon>mdi-playlist-remove</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('playback.clearQueue') }}</span>
        </v-tooltip>
        <v-tooltip top>
          <template #activator="{ on: tooltip }">
            <v-btn icon disabled v-on="tooltip" @click="stop">
              <v-icon>mdi-content-save</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('playback.saveAsPlaylist') }}</span>
        </v-tooltip>
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import { InitMode } from '~/store/playbackManager';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    nudgeTop: {
      type: Number,
      default: 0
    },
    closeOnClick: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      menu: false,
      destroy: false
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapState('playbackManager', [
      'queue',
      'playbackInitiator',
      'playbackInitMode'
    ]),
    sourceText: {
      get(): string {
        /**
         * TODO: Properly refactor this once search and other missing features are implemented, as discussed in
         * https://github.com/jellyfin/jellyfin-vue/pull/609
         */
        switch (this.playbackInitMode) {
          case InitMode.Unknown:
            return this.$t('playback.playbackSource.unknown');
          case InitMode.Item:
            if (this.getCurrentItem.AlbumId !== this.playbackInitiator?.Id) {
              return this.$t('playback.playbackSource.unknown');
            } else {
              return this.$t('playback.playbackSource.item', {
                item: this.playbackInitiator?.Name
              });
            }
          case InitMode.Shuffle:
            return this.$t('playback.playbackSource.shuffle');
          case InitMode.ShuffleItem:
            if (this.getCurrentItem.AlbumId !== this.playbackInitiator?.Id) {
              return this.$t('playback.playbackSource.unknown');
            } else {
              return this.$t('playback.playbackSource.shuffleItem', {
                item: this.playbackInitiator?.Name
              });
            }
          default:
            return '';
        }
      }
    },
    initiator: {
      get(): BaseItemDto | null {
        if (this.getCurrentItem.AlbumId === this.playbackInitiator?.Id) {
          return this.playbackInitiator;
        }

        return null;
      }
    },
    modeIcon: {
      get(): string {
        switch (this.playbackInitMode) {
          case InitMode.Shuffle:
            return 'mdi-shuffle';
          default:
            return 'mdi-playlist-music';
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
  },
  methods: {
    ...mapActions('playbackManager', ['stop'])
  }
});
</script>

<style lang="scss" scoped>
.menu {
  user-select: none;
  overflow: hidden;
}

.overflow {
  overflow-y: scroll;
  overflow-x: hidden;
  min-height: 40vh;
  max-height: 40vh;
}
</style>
