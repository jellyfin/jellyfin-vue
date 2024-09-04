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
      :close-on-content-click="closeOnClick"
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
              {{ getTotalEndsAtTime(playbackManager.queue) }} -
              {{
                $t('queueItems', {
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
              :text="$t('clearQueue')"
              location="top" />
          </VBtn>
          <VBtn
            icon
            disabled>
            <VIcon>
              <IMdiContentSave />
            </VIcon>
            <VTooltip
              :text="$t('saveAsPlaylist')"
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
import { InitMode, playbackManager } from '@/store/playback-manager';

const { size = 40, closeOnClick = false } = defineProps<{
  size?: number;
  closeOnClick?: boolean;
}>();

const { t } = useI18n();

const menuModel = ref(false);
const listWidth = computed(() => `${size}vw`);
const listHeight = computed(() => `${size}vh`);

const sourceText = computed(() => {
  /**
   * TODO: Properly refactor this once search and other missing features are implemented, as discussed in
   * https://github.com/jellyfin/jellyfin-vue/pull/609
   */
  const unknownSource = t('unknown');

  switch (playbackManager.playbackInitMode) {
    case InitMode.Unknown: {
      return unknownSource;
    }
    case InitMode.Item: {
      return playbackManager.currentItem?.AlbumId
        === playbackManager.initiator?.Id
        ? t('playingFrom', {
          item: playbackManager.initiator?.Name
        })
        : unknownSource;
    }
    case InitMode.Shuffle: {
      return t('playinginShuffle');
    }
    case InitMode.ShuffleItem: {
      return playbackManager.currentItem?.AlbumId
        === playbackManager.initiator?.Id
        ? t('playingItemInShuffle', {
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

<style scoped>
.queue-area {
  min-height: v-bind(listHeight);
  max-height: v-bind(listHeight);
}
</style>
