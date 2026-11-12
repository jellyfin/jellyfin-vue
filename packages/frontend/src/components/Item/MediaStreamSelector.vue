<template>
  <VSelect
    v-model="trackIndex"
    :clearable="type === 'Subtitle'"
    :placeholder="type === 'Subtitle' ? t('disabled') : undefined"
    density="comfortable"
    hide-details
    single-line
    class="text-truncate uno-capitalize"
    :items="selectItems">
    <template #selection="{ item }">
      {{ item.raw.selection }}
    </template>

    <template #item="{ item, props: templateProps }">
      <VListItem
        v-bind="templateProps"
        :title="item.raw.title"
        :subtitle="item.raw.subtitle">
        <template #prepend>
          <JIcon
            :class="item.raw.icon"
            class="uno-w-10" />
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>

<script setup lang="ts">
import { computed, capitalize } from 'vue';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useTranslation } from 'i18next-vue';
import { getLocaleName } from '#/utils/i18n.ts';

/**
 * Track indexes are always the absolute `MediaStream.Index` of the streams.
 *
 * The selected stream is controlled by the parent: the component displays `defaultStreamIndex`
 * and only emits `input` when the user picks a stream, so displaying the default
 * (or following changes of it) never counts as an explicit choice.
 */
const { mediaStreams, type, defaultStreamIndex } = defineProps<{
  mediaStreams: MediaStream[];
  type: string;
  /**
   * Index of the stream to display as selected. For subtitles, a missing value or `-1`
   * displays "disabled". For video and audio, a missing value displays the stream flagged
   * as default (or the first one).
   */
  defaultStreamIndex?: number;
}>();
const emit = defineEmits<{
  /**
   * Index of the stream picked by the user, or `-1` when the subtitles are disabled.
   */
  input: [newIndex: number];
}>();
const { t, i18next } = useTranslation();

/**
 * Audio layout to get related icon
 * @returns Icon name
 */
function getSurroundIcon(layout: string) {
  switch (layout) {
    case '2.0': {
      return 'i-mdi:surround-sound-2-0';
    }
    case '3.1': {
      return 'i-mdi:surround-sound-3-1';
    }
    case '5.1': {
      return 'i-mdi:surround-sound-5-1';
    }
    case '7.1': {
      return 'i-mdi:surround-sound-7-1';
    }
    default: {
      return 'i-mdi:surround-sound';
    }
  }
}

/**
 * Get track icons
 * @returns Optional icon to use for the track line in the v-select menu
 */
function getTrackIcon(
  track: MediaStream
) {
  if (type === 'Audio' && track.ChannelLayout) {
    return getSurroundIcon(track.ChannelLayout);
  }
}

/**
 * Parse track subtitles
 * @returns Optional subtitle to use for the track line in the v-select menu
 */
function getTrackSubtitle(track: MediaStream): string | undefined {
  if ((type === 'Audio' || type === 'Subtitle') && track.Language) {
    return capitalize(
      getLocaleName(track.Language, i18next.language)
      ?? `${t('unknown')} (${track.Language})`
    );
  }

  if (type === 'Audio' || type === 'Subtitle') {
    return t('undefined');
  }
}

/**
 * Used to model the media stream index as a value and the potential strings
 *
 * @returns List of objects prepared for Vuetify v-select with the strings to display as "text" and index number as "value".
 */
const selectItems = computed(() =>
  mediaStreams.map(value => ({
    icon: getTrackIcon(value),
    selection: value.DisplayTitle ?? '',
    subtitle: getTrackSubtitle(value),
    title: value.DisplayTitle ?? '',
    value: value.Index
  }))
);

/**
 * Index displayed as selected (null if none, because that's VSelect's empty value)
 */
const trackIndex = computed({
  get: () => {
    const stream = mediaStreams.find(track => track.Index === defaultStreamIndex)
      ?? (type === 'Subtitle'
        ? undefined
        : mediaStreams.find(track => track.IsDefault) ?? mediaStreams[0]);

    // eslint-disable-next-line unicorn/no-null
    return stream?.Index ?? null;
  },
  set: (newIndex: number | null | undefined) => {
    emit('input', newIndex ?? -1);
  }
});
</script>
