<template>
  <v-btn icon class="align-self-center">
    <v-icon>
      <i-mdi-playlist-play />
    </v-icon>
    <v-tooltip :text="$t('queue')" location="top" />
    <v-menu
      v-model="menuModel"
      :close-on-content-click="false"
      :persistent="!closeOnClick"
      :transition="'slide-y-transition'"
      :width="listWidth"
      location="top">
      <v-card>
        <v-list>
          <v-list-item :title="sourceText">
            <template #prepend>
              <v-avatar>
                <blurhash-image
                  v-if="playbackManager.initiator"
                  :item="playbackManager.initiator" />
                <v-icon v-else :icon="modeIcon" />
              </v-avatar>
            </template>
            <template #subtitle>
              {{ getTotalEndsAtTime(playbackManager.queue).value }} -
              {{
                $t('playback.queueItems', {
                  items: playbackManager.queue.length
                })
              }}
            </template>
          </v-list-item>
        </v-list>
        <v-divider />
        <v-list class="queue-area">
          <draggable-queue />
        </v-list>
        <v-spacer />
        <v-card-actions>
          <v-btn icon @click="playbackManager.stop">
            <v-icon>
              <i-mdi-playlist-remove />
            </v-icon>
            <v-tooltip :text="$t('playback.clearQueue')" location="top" />
          </v-btn>
          <v-btn icon disabled>
            <v-icon>
              <i-mdi-content-save />
            </v-icon>
            <v-tooltip :text="$t('playback.saveAsPlaylist')" location="top" />
          </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiPlaylistMusic from 'virtual:icons/mdi/playlist-music';
import { playbackManagerStore } from '@/store';
import { InitMode } from '@/store/playbackManager';
import { getTotalEndsAtTime } from '@/utils/time';

const props = withDefaults(
  defineProps<{
    closeOnClick?: boolean;
    size?: number;
  }>(),
  { closeOnClick: false, size: 40 }
);

const playbackManager = playbackManagerStore();
const { t } = useI18n();

const menuModel = ref(false);
const listWidth = computed(() => `${props.size}vw`);
// const listHeight = computed(() => `${props.size}vh`);

const sourceText = computed(() => {
  /**
   * TODO: Properly refactor this once search and other missing features are implemented, as discussed in
   * https://github.com/jellyfin/jellyfin-vue/pull/609
   */
  const unknownSource = t('playback.playbackSource.unknown');

  switch (playbackManager.playbackInitMode) {
    case InitMode.Unknown: {
      return unknownSource;
    }
    case InitMode.Item: {
      return playbackManager.currentItem?.AlbumId !==
        playbackManager.initiator?.Id
        ? unknownSource
        : t('playback.playbackSource.item', {
            item: playbackManager.initiator?.Name
          });
    }
    case InitMode.Shuffle: {
      return t('playback.playbackSource.shuffle');
    }
    case InitMode.ShuffleItem: {
      return playbackManager.currentItem?.AlbumId !==
        playbackManager.initiator?.Id
        ? unknownSource
        : t('playback.playbackSource.shuffleItem', {
            item: playbackManager.initiator?.Name
          });
    }
    default: {
      return '';
    }
  }
});

const modeIcon = computed(() =>
  playbackManager.playbackInitMode === InitMode.Shuffle
    ? IMdiShuffle
    : IMdiPlaylistMusic
);
</script>

<style lang="scss" scoped>
/**
For some reason, v-bind doesn't work with this, so we must manually update this
if we ever want to change the size

TODO: Investigate why
 */
.queue-area {
  min-height: 40vh;
  max-height: 40vh;
}
</style>
