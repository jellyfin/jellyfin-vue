<template>
  <v-select
    v-model="trackIndex"
    density="comfortable"
    single-line
    hide-details
    class="text-truncate"
    :items="selectItems">
    <template #selection="{ item }">
      {{ item.raw.selection }}
    </template>

    <template #item="{ item, props: templateProps }">
      <v-list-item
        v-bind="templateProps"
        :title="item.raw.title"
        :subtitle="item.raw.subtitle"
        :prepend-icon="item.raw.icon" />
    </template>
  </v-select>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import langs from 'langs';
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import IMdiSurroundSound20 from 'virtual:icons/mdi/surround-sound-2-0';
import IMdiSurroundSound31 from 'virtual:icons/mdi/surround-sound-3-1';
import IMdiSurroundSound51 from 'virtual:icons/mdi/surround-sound-5-1';
import IMdiSurroundSound71 from 'virtual:icons/mdi/surround-sound-7-1';
import IMdiSurroundSound from 'virtual:icons/mdi/surround-sound';

const props = withDefaults(
  defineProps<{
    mediaStreams?: MediaStream[];
    type: string;
    defaultStreamIndex?: number;
  }>(),
  { mediaStreams: () => [], defaultStreamIndex: undefined }
);
const emits = defineEmits<{
  (e: 'input', newIndex?: number): void;
}>();
const { t } = useI18n();

/**
 * Audio layout to get related icon
 * @returns Icon name
 */
function getSurroundIcon(layout: string): typeof IMdiSurroundSound {
  switch (layout) {
    case '2.0': {
      return IMdiSurroundSound20;
    }
    case '3.1': {
      return IMdiSurroundSound31;
    }
    case '5.1': {
      return IMdiSurroundSound51;
    }
    case '7.1': {
      return IMdiSurroundSound71;
    }
    default: {
      return IMdiSurroundSound;
    }
  }
}

/**
 * Converts a two letters language code to full word
 * @returns Full word
 */
function getLanguageName(code: string): string {
  return langs.where('2B', code)?.name || '';
}

/**
 * Get track icons
 * @returns Optional icon to use for the track line in the v-select menu
 */
function getTrackIcon(
  track: MediaStream
): typeof IMdiSurroundSound | undefined {
  if (props.type === 'Audio' && track.ChannelLayout) {
    return getSurroundIcon(track.ChannelLayout);
  }
}

/**
 * Parse track subtitles
 * @returns Optional subtitle to use for the track line in the v-select menu
 */
function getTrackSubtitle(track: MediaStream): string | undefined {
  if ((props.type === 'Audio' || props.type === 'Subtitle') && track.Language) {
    return getLanguageName(track.Language);
  } else if (props.type === 'Audio' || props.type === 'Subtitle') {
    return t('undefined');
  }
}

/**
 * Used to model the media stream index as a value and the potential strings
 *
 * @returns List of objects prepared for Vuetify v-select with the strings to display as "text" and index number as "value".
 */
const selectItems = computed(() => {
  const items = props.mediaStreams.map((value) => {
    return {
      icon: getTrackIcon(value),
      selection: value.DisplayTitle ?? '',
      subtitle: getTrackSubtitle(value),
      title: value.DisplayTitle ?? '',
      value: value.Index
    };
  });

  if (props.type === 'Subtitle') {
    items.unshift({
      icon: undefined,
      selection: t('disabled'),
      subtitle: undefined,
      value: -1,
      title: t('disabled')
    });
  }

  return items;
});

/**
 * Default index to use (undefined if none)
 */
const defaultIndex =
  props.defaultStreamIndex !== undefined
    ? props.defaultStreamIndex
    : props.mediaStreams.find((track) => track.IsDefault)?.Index;

const trackIndex = ref<number | undefined>(
  defaultIndex !== undefined ? defaultIndex : -1
);

/**
 * Check if Type is Video and trackIndex is -1 then set trackIndex as this.selectItems[0].value
 */
if (
  props.type === 'Video' &&
  trackIndex.value === -1 &&
  selectItems.value[0] !== undefined
) {
  trackIndex.value = selectItems.value[0].value;
}

emits('input', trackIndex.value);

watch(
  () => props.defaultStreamIndex,
  (newValue) => {
    if (newValue !== trackIndex.value) {
      trackIndex.value = newValue;
    }
  }
);
</script>
