<template>
  <v-menu
    v-model="menuModel"
    :close-on-content-click="false"
    transition="slide-y-transition"
    location="top">
    <template #activator="{ props: menu }">
      <tooltip-button
        class="align-self-center active-button"
        v-bind="menu"
        :btn="{
          icon: true,
          disabled:
            !playbackManager.currentItemParsedSubtitleTracks ||
            playbackManager.currentItemParsedSubtitleTracks.length === 0
        }"
        :tooltip="{ text: $t('subtitles'), location: 'top' }">
        <v-icon>
          <i-mdi-closed-caption v-if="playbackManager.currentSubtitleTrack" />
          <i-mdi-closed-caption-outline v-else />
        </v-icon>
      </tooltip-button>
    </template>
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
        @click="playbackManager.currentSubtitleStreamIndex = track.srcIndex" />
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVModel } from '@vueuse/core';
import IMdiCheck from 'virtual:icons/mdi/check';
import { playbackManagerStore } from '@/store';

const props = defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const menuModel = useVModel(props, 'modelValue', emit);

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
