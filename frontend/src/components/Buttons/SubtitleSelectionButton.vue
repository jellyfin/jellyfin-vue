<template>
  <VBtn
    icon
    class="align-self-center"
    :disabled="
      !playerElement.currentItemParsedSubtitleTracks.value ||
        playerElement.currentItemParsedSubtitleTracks.value.length === 0
    ">
    <VIcon>
      <IMdiClosedCaption v-if="playbackManager.currentSubtitleTrack.value" />
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
      <VList class="uno-overflow-hidden">
        <VListItem
          v-for="track of tracks"
          :key="track.srcIndex"
          :append-icon="
            track.srcIndex === playbackManager.currentSubtitleTrack.value?.Index
              ? IMdiCheck
              : undefined
          "
          :title="track.label"
          @click="
            playbackManager.currentSubtitleTrack.value = track.srcIndex
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
import { playbackManager } from '#/store/playback-manager';
import { playerElement } from '#/store/player-element';

const menuModel = defineModel<boolean>();

const { t } = useI18n();

const tracks = computed(() => {
  const subs = playerElement.currentItemParsedSubtitleTracks.value;

  return [
    {
      label: t('disabled'),
      srcIndex: -1,
      type: SubtitleDeliveryMethod.External
    },
    ...(subs ?? [])
  ];
});
</script>
