<template>
  <JTooltip
    :text="$t('subtitles')"
    position="top">
    <VBtn
      icon
      class="align-self-center"
      :disabled="
        !playerElement.currentItemParsedSubtitleTracks.value ||
          playerElement.currentItemParsedSubtitleTracks.value.length === 0
      ">
      <JIcon
        :class="{
          'i-mdi:closed-caption': playbackManager.currentSubtitleTrack.value,
          'i-mdi:closed-caption-outline': !playbackManager.currentSubtitleTrack.value
        }" />
      <VMenu
        v-model="menuModel"
        :close-on-content-click="false"
        transition="slide-y-transition"
        location="top">
        <VList class="uno-overflow-hidden">
          <VListItem
            v-for="track of tracks"
            :key="track.srcIndex"
            :title="track.label"
            @click="
              playbackManager.currentSubtitleTrack.value = track.srcIndex
            ">
            <template
              v-if="track.srcIndex === playbackManager.currentSubtitleTrack.value?.Index"
              #prepend>
              <JIcon class="i-mdi:check uno-w-10" />
            </template>
          </VListItem>
        </VList>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client';
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
