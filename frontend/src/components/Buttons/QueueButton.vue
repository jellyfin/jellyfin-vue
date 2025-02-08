<template>
  <JTooltip
    position="top"
    :text="$t('queue')">
    <VBtn
      icon
      class="align-self-center">
      <JIcon class="i-mdi:playlist-play" />
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
                    v-if="playbackManager.initiator.value"
                    :item="playbackManager.initiator.value" />
                  <JIcon
                    v-else
                    :class="modeIcon" />
                </VAvatar>
              </template>
              <template #subtitle>
                {{ getTotalEndsAtTime(playbackManager.queue.value) }} -
                {{
                  $t('queueItems', {
                    items: playbackManager.queueLength.value
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
            <JTooltip
              position="top"
              :text="$t('clearQueue')">
              <VBtn
                icon
                @click="playbackManager.stop">
                <JIcon class="i-mdi:playlist-remove" />
              </VBtn>
            </JTooltip>
            <JTooltip
              position="top"
              :text="$t('saveAsPlaylist')">
              <VBtn
                icon
                disabled>
                <JIcon class="i-mdi:content-save" />
              </VBtn>
            </JTooltip>
            <VSpacer />
          </VCardActions>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import JTooltip from '../../../../packages/ui-toolkit/src/components/JTooltip.vue';
import { getTotalEndsAtTime } from '#/utils/time';
import { InitMode, playbackManager } from '#/store/playback-manager';

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
  const isFromAlbum = playbackManager.currentItem.value?.AlbumId
    === playbackManager.initiator.value?.Id;
  const substitution = {
    item: playbackManager.initiator.value?.Name
  };

  switch (playbackManager.playbackInitMode.value) {
    case InitMode.Unknown: {
      return unknownSource;
    }
    case InitMode.Item: {
      return isFromAlbum
        ? t('playingFrom', substitution)
        : unknownSource;
    }
    case InitMode.Shuffle: {
      return t('playinginShuffle');
    }
    case InitMode.ShuffleItem: {
      return isFromAlbum
        ? t('playingItemInShuffle', substitution)
        : unknownSource;
    }
  }
});

const modeIcon = computed(() =>
  playbackManager.playbackInitMode.value === InitMode.Shuffle
    ? 'i-mdi:shuffle'
    : 'i-mdi:playlist-music'
);
</script>

<style scoped>
.queue-area {
  min-height: v-bind(listHeight);
  max-height: v-bind(listHeight);
}
</style>
