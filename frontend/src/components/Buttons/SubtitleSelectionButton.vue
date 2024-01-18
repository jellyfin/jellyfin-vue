<template>
  <VBtn
    icon
    class="align-self-center"
    :disabled="
      !playbackManager.currentItemParsedSubtitleTracks ||
        playbackManager.currentItemParsedSubtitleTracks.length === 0
    ">
    <VIcon>
      <IMdiClosedCaption v-if="playbackManager.currentSubtitleTrack" />
      <IMdiClosedCaptionOutline v-else />
    </VIcon>
    <VTooltip
      :text="$t('subtitles')"
      location="top" />
    <VMenu
      v-model="menuModel"
      :close-on-content-click="false"
      transition="slide-y-transition"
      location="top">
      <VList class="overflow-hidden">
        <VListItem
          v-for="track of tracks"
          :key="track.srcIndex"
          :append-icon="
            track.srcIndex === playbackManager.currentSubtitleStreamIndex
              ? IMdiCheck
              : undefined
          "
          :title="track.label"
          @click="
            playbackManager.currentSubtitleStreamIndex = track.srcIndex
          " />
      </VList>
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client';
import IMdiCheck from 'virtual:icons/mdi/check';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { playbackManager } from '@/store/playbackManager';

const menuModel = defineModel<boolean>();

const { t } = useI18n();

const tracks = computed(() => {
  const subs = playbackManager.currentItemParsedSubtitleTracks;

  return [
    {
      label: t('disabled'),
      srcIndex: undefined,
      type: SubtitleDeliveryMethod.External
    },
    ...(subs ?? [])
  ];
});
</script>
