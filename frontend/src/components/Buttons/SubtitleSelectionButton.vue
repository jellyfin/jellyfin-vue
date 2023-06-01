<template>
  <v-btn
    icon
    class="align-self-center"
    :disabled="
      !playbackManager.currentItemParsedSubtitleTracks ||
      playbackManager.currentItemParsedSubtitleTracks.length === 0
    ">
    <v-icon>
      <i-mdi-closed-caption v-if="playbackManager.currentSubtitleTrack" />
      <i-mdi-closed-caption-outline v-else />
    </v-icon>
    <v-tooltip :text="$t('subtitles')" location="top" />
    <v-menu
      v-model="menuModel"
      :close-on-content-click="false"
      transition="slide-y-transition"
      location="top">
      <v-list class="overflow-hidden">
        <v-list-item
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
      </v-list>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import IMdiCheck from 'virtual:icons/mdi/check';
import { playbackManagerStore } from '@/store';

const menuModel = defineModel<boolean>();

const { t } = useI18n();
const playbackManager = playbackManagerStore();

const tracks = computed(() => {
  const subs = playbackManager.currentItemParsedSubtitleTracks;

  return [
    {
      label: t('disabled'),
      srcIndex: -1,
      type: SubtitleDeliveryMethod.External
    },
    ...(subs || [])
  ];
});
</script>
