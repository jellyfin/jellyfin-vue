<template>
  <v-menu
    v-model="menuModel"
    :close-on-content-click="false"
    :persistent="!closeOnClick"
    :transition="'slide-y-transition'"
    location="top">
    <template #activator="{ props: menu }">
      <tooltip-button
        class="align-self-center"
        v-bind="menu"
        :tooltip="{ text: $t('queue'), location: 'top' }"
        :btn="{ icon: true }">
        <v-icon>
          <i-mdi-playlist-play />
        </v-icon>
      </tooltip-button>
    </template>
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

          <template #append>
            <like-button
              v-if="playbackManager.initiator && playbackManager.currentItem"
              :item="playbackManager.currentItem" />
            <item-menu
              v-if="playbackManager.initiator && playbackManager.currentItem"
              :item="playbackManager.currentItem" />
          </template>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list class="overflow">
        <!-- We set an special property to destroy the element so it doesn't take resources while it's not being used.
        This is especially useful for really huge queues. -->
        <draggable-queue v-if="menuModel || !destroy" class="ml-4" />
      </v-list>
      <v-spacer />
      <v-card-actions>
        <tooltip-button
          :tooltip="{ text: $t('playback.clearQueue'), location: 'top' }"
          :btn="{ icon: true }"
          @click="playbackManager.stop">
          <v-icon>
            <i-mdi-playlist-remove />
          </v-icon>
        </tooltip-button>
        <tooltip-button
          :tooltip="{ text: $t('playback.saveAsPlaylist'), location: 'top' }"
          :btn="{ icon: true, disabled: true }">
          <v-icon>
            <i-mdi-content-save />
          </v-icon>
        </tooltip-button>
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimeoutFn } from '@vueuse/core';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiPlaylistMusic from 'virtual:icons/mdi/playlist-music';
import { playbackManagerStore } from '@/store';
import { InitMode } from '@/store/playbackManager';
import { getTotalEndsAtTime } from '@/utils/time';

withDefaults(
  defineProps<{
    closeOnClick?: boolean;
  }>(),
  { closeOnClick: false }
);

const playbackManager = playbackManagerStore();
const { t } = useI18n();

const menuModel = ref(false);
const destroy = ref(false);
const timeout = useTimeoutFn(() => {
  destroy.value = true;
}, 500);

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

watch(menuModel, (val) => {
  if (!val) {
    timeout.start();
  } else {
    timeout.stop();
    destroy.value = false;
  }
});
</script>

<style lang="scss" scoped>
.overflow {
  overflow-y: scroll;
  overflow-x: hidden;
  min-height: 40vh;
  max-height: 40vh;
}
</style>
