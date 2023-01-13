<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :persistent="!closeOnClick"
    :transition="'slide-y-transition'"
    location="top"
    :nudge-top="nudgeTop"
    offset-y
    min-width="35vw"
    max-width="35vw"
    min-height="60vh"
    max-height="60vh"
    :z-index="500"
    class="menu"
    @input="$emit('input', $event)">
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <v-tooltip location="top">
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            icon
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }">
            <v-icon>
              <i-mdi-playlist-play />
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('queue') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list>
        <v-list-item>
          <v-avatar>
            <blurhash-image
              v-if="playbackManager.initiator"
              :item="playbackManager.initiator" />
            <v-icon v-else :icon="modeIcon" />
          </v-avatar>

          <v-list-item-title>{{ sourceText }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ getTotalEndsAtTime(playbackManager.queue) }} -
            {{
              $t('playback.queueItems', {
                items: playbackManager.queue.length
              })
            }}
          </v-list-item-subtitle>

          <v-list-item-action>
            <like-button
              v-if="playbackManager.initiator && playbackManager.currentItem"
              :item="playbackManager.currentItem" />
          </v-list-item-action>
          <v-list-item-action class="mr-1">
            <item-menu
              v-if="playbackManager.initiator && playbackManager.currentItem"
              :item="playbackManager.currentItem" />
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
        <v-tooltip location="top">
          <template #activator="{ on: tooltip }">
            <v-btn icon v-on="tooltip" @click="playbackManager.stop">
              <v-icon>
                <i-mdi-playlist-remove />
              </v-icon>
            </v-btn>
          </template>
          <span>{{ $t('playback.clearQueue') }}</span>
        </v-tooltip>
        <v-tooltip location="top">
          <template #activator="{ on: tooltip }">
            <v-btn icon disabled v-on="tooltip">
              <v-icon>
                <i-mdi-content-save />
              </v-icon>
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
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { defineComponent } from 'vue';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiPlaylistMusic from 'virtual:icons/mdi/playlist-music';
import { playbackManagerStore } from '@/store';
import { InitMode } from '@/store/playbackManager';
import { getTotalEndsAtTime } from '@/utils/time';

export default defineComponent({
  props: {
    nudgeTop: {
      type: [Number, String],
      default: 0
    },
    closeOnClick: {
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
      menu: false,
      destroy: false,
      timeout: undefined as undefined | number
    };
  },
  computed: {
    sourceText(): string {
      /**
       * TODO: Properly refactor this once search and other missing features are implemented, as discussed in
       * https://github.com/jellyfin/jellyfin-vue/pull/609
       */
      const unknownSource = this.$t('playback.playbackSource.unknown');

      switch (this.playbackManager.playbackInitMode) {
        case InitMode.Unknown: {
          return unknownSource;
        }
        case InitMode.Item: {
          return this.playbackManager.currentItem?.AlbumId !==
            this.playbackManager.initiator?.Id
            ? unknownSource
            : this.$t('playback.playbackSource.item', {
                item: this.playbackManager.initiator?.Name
              });
        }
        case InitMode.Shuffle: {
          return this.$t('playback.playbackSource.shuffle');
        }
        case InitMode.ShuffleItem: {
          return this.playbackManager.currentItem?.AlbumId !==
            this.playbackManager.initiator?.Id
            ? unknownSource
            : this.$t('playback.playbackSource.shuffleItem', {
                item: this.playbackManager.initiator?.Name
              });
        }
        default: {
          return '';
        }
      }
    },
    initiator(): BaseItemDto | undefined {
      if (
        this.playbackManager.currentItem?.AlbumId ===
        this.playbackManager.initiator?.Id
      ) {
        return this.playbackManager.initiator;
      }
    },
    modeIcon(): typeof IMdiShuffle {
      if (this.playbackManager.playbackInitMode === InitMode.Shuffle) {
        return IMdiShuffle;
      }

      return IMdiPlaylistMusic;
    }
  },
  /**
   * We destroy objects 500 ms after the menu has been closed, so they're visible while the transition is taking place
   */
  watch: {
    menu(): void {
      if (!this.menu) {
        this.timeout = window.setTimeout(() => {
          this.destroy = true;
        }, 500);
      } else {
        window.clearTimeout(this.timeout);
        this.timeout = undefined;
        this.destroy = false;
      }
    }
  },
  methods: {
    getTotalEndsAtTime
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
