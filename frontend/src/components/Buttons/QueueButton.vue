<template>
  <VBtn
    icon
    class="align-self-center">
    <VIcon>
      <IMdiPlaylistPlay />
    </VIcon>
    <VTooltip
      :text="$t('queue')"
      location="top" />
    <VMenu
      v-model="menuModel"
      :close-on-content-click="false"
      :persistent="!closeOnClick"
      :transition="'slide-y-transition'"
      :width="listWidth"
      location="top">
      <VCard>
        <VList>
          <VListItem :title="sourceText">
            <template #prepend>
              <VAvatar>
                <BlurhashImage
                  v-if="playbackManager.initiator"
                  :item="playbackManager.initiator" />
                <VIcon
                  v-else
                  :icon="modeIcon" />
              </VAvatar>
            </template>
            <template #subtitle>
              {{ getTotalEndsAtTime(playbackManager.queue).value }} -
              {{
                $t('playback.queueItems', {
                  items: playbackManager.queue.length
                })
              }}
            </template>
          </VListItem>
        </VList>
        <VDivider />
        <VList class="queue-area">
          <DraggableQueue />
        </VList>
        <VSpacer />
        <VCardActions>
          <VBtn
            icon
            @click="playbackManager.stop">
            <VIcon>
              <IMdiPlaylistRemove />
            </VIcon>
            <VTooltip
              :text="$t('playback.clearQueue')"
              location="top" />
          </VBtn>
          <VBtn
            icon
            disabled>
            <VIcon>
              <IMdiContentSave />
            </VIcon>
            <VTooltip
              :text="$t('playback.saveAsPlaylist')"
              location="top" />
          </VBtn>
          <VSpacer />
        </VCardActions>
      </VCard>
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import IMdiPlaylistMusic from 'virtual:icons/mdi/playlist-music';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTotalEndsAtTime } from '@/utils/time';
import { InitMode } from '@/store/playbackManager';
import { playbackManagerStore } from '@/store';

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
const listHeight = computed(() => `${props.size}vh`);

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
      return playbackManager.currentItem?.AlbumId ===
        playbackManager.initiator?.Id
        ? t('playback.playbackSource.item', {
          item: playbackManager.initiator?.Name
        })
        : unknownSource;
    }
    case InitMode.Shuffle: {
      return t('playback.playbackSource.shuffle');
    }
    case InitMode.ShuffleItem: {
      return playbackManager.currentItem?.AlbumId ===
        playbackManager.initiator?.Id
        ? t('playback.playbackSource.shuffleItem', {
          item: playbackManager.initiator?.Name
        })
        : unknownSource;
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
.queue-area {
  min-height: v-bind(listHeight);
  max-height: v-bind(listHeight);
}
</style>
