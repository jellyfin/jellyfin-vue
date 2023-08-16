<template>
  <generic-dialog :model-value="model" :title="displayName" @close="close">
    <template v-if="mediaSources.length > 1">
      <v-card-text>
        <media-source-selector
          class="pt-2"
          :default-source-index="selectedMediaSourceIndex"
          :sources="mediaSources"
          :label="t('selectVersion')"
          @input="selectedMediaSourceIndex = $event" />
      </v-card-text>
      <v-divider />
    </template>

    <template v-if="generalProperties">
      <v-container>
        <template v-for="[key, val] of generalProperties">
          <media-detail-attr
            v-if="!isNil(val)"
            :key="key"
            :name="key"
            :value="val" />
        </template>
      </v-container>
    </template>

    <v-card-text
      v-if="selectedMediaSource"
      class="pa-3 d-flex flex-column flex-grow-1">
      <template v-if="(selectedMediaSource.MediaStreams?.length ?? 0) > 0">
        <v-tabs v-model="currentTab" direction="horizontal" center-active>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsVideo"
            :key="`mediaStreamTabVideo-${idx}-${String(_)}`"
            :value="`video-${idx}`">
            {{
              t(
                'mediaInfoTitlesVideoCodec',
                [idx + 1],
                selectedMediaStreamsVideo.length
              )
            }}
          </v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsAudio"
            :key="`mediaStreamTabAudio-${idx}-${String(_)}`"
            :value="`audio-${idx}`">
            {{
              `${t(
                'mediaInfoTitlesAudioCodec',
                [idx + 1],
                selectedMediaStreamsAudio.length
              )} (${getDisplayLocaleName(
                selectedMediaStreamsAudio[idx]?.Language
              )})`
            }}
          </v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsSubs"
            :key="`mediaStreamTabSubs-${idx}-${String(_)}`"
            :value="`subs-${idx}`">
            {{
              `${t(
                'mediaInfoTitlesSubtitleCodec',
                [idx + 1],
                selectedMediaStreamsSubs.length
              )} (${getDisplayLocaleName(
                selectedMediaStreamsSubs[idx]?.Language
              )})`
            }}
          </v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsImage"
            :key="`mediaStreamTabEmbedImage-${idx}-${String(_)}`"
            :value="`image-${idx}`">
            {{
              t(
                'mediaInfoTitlesEmbeddedImageCodec',
                [idx + 1],
                selectedMediaStreamsImage.length
              )
            }}
          </v-tab>
        </v-tabs>
        <v-window v-model="currentTab" class="pa-2 flex-fill">
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsVideo"
            :key="`mediaStreamTabWVideo-${idx}-${String(mediaStream)}`"
            :value="`video-${idx}`">
            <media-detail-content
              :stream="mediaStream"
              :video-timestamp="selectedMediaSource.Timestamp" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsAudio"
            :key="`mediaStreamTabWAudio-${idx}-${String(mediaStream)}`"
            :value="`audio-${idx}`">
            <media-detail-content :stream="mediaStream" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsSubs"
            :key="`mediaStreamTabWSubs-${idx}-${String(mediaStream)}`"
            :value="`subs-${idx}`">
            <media-detail-content :stream="mediaStream" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsImage"
            :key="`mediaStreamTabWEmbedImage-${idx}-${String(mediaStream)}`"
            :value="`image-${idx}`">
            <media-detail-content :stream="mediaStream" />
          </v-window-item>
        </v-window>
      </template>
      <h2 v-else class="no-media text-center">
        {{ t('NoMediaStreamsAvailable') }}
      </h2>
    </v-card-text>
    <v-card-text
      v-else
      class="pa-0 pb-8 flex-grow-1"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <h2 class="no-media">
        {{ t('NoMediaSourcesAvailable') }}
      </h2>
    </v-card-text>
  </generic-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isNil } from 'lodash-es';
import {
  BaseItemDto,
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { formatBitRate, formatFileSize } from '@/utils/items';
import { isNumber } from '@/utils/validation';
import { getLocaleName } from '@/utils/i18n';

const props = defineProps<{ item: BaseItemDto; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  close: [];
}>();

const { t, locale } = useI18n();

const model = ref(true);
const currentTab = ref<string>();

const close = (): void => {
  model.value = false;
  emit('close');
};

const mediaSources = computed<MediaSourceInfo[]>(() => {
  return props.item.MediaSources ?? [];
});

const selectedMediaSourceIndex = ref<number>(props.mediaSourceIndex ?? 0);
const selectedMediaSource = computed<MediaSourceInfo | undefined>(
  () => mediaSources.value[selectedMediaSourceIndex.value] ?? undefined
);
const selectedMediaStreamsVideo = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    (s) => s.Type === 'Video'
  )
);
const selectedMediaStreamsAudio = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    (s) => s.Type === 'Audio'
  )
);
const selectedMediaStreamsSubs = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    (s) => s.Type === 'Subtitle'
  )
);
const selectedMediaStreamsImage = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    (s) => s.Type === 'EmbeddedImage'
  )
);

const displayName = computed(() => {
  if ((props.item.MediaSources?.length ?? 0) > 1) {
    const parent = props.item.Name;

    if (parent) {
      return `${parent} - ${selectedMediaSource.value?.Name ?? ''}`;
    }
  }

  return selectedMediaSource.value?.Name ?? t('mediaInfo');
});
const generalProperties = computed(() => {
  if (selectedMediaSource.value) {
    const p = new Map<string, string | number | boolean | null | undefined>();
    const formats =
      Array.isArray(selectedMediaSource.value.Formats) &&
      selectedMediaSource.value.Formats.length > 0
        ? selectedMediaSource.value.Formats.join(',')
        : undefined;
    const fileSize = isNumber(selectedMediaSource.value.Size)
      ? formatFileSize(selectedMediaSource.value.Size)
      : undefined;
    const bitrate =
      isNumber(selectedMediaSource.value.Bitrate) &&
      selectedMediaSource.value.Bitrate > 0
        ? formatBitRate(selectedMediaSource.value.Bitrate)
        : undefined;

    p.set(t('mediaInfoFileContainer'), selectedMediaSource.value.Container);
    p.set(t('mediaInfoFileFormats'), formats);
    p.set(t('mediaInfoFilePath'), selectedMediaSource.value.Path);
    p.set(t('mediaInfoFileSize'), fileSize);
    p.set(t('mediaInfoGenericBitrate'), bitrate);

    return p.entries();
  }
});

/**
 * Invokes i18n's getLocaleName for getting the name of the locale
 * of a media stream
 */
function getDisplayLocaleName(language: string | null | undefined): string {
  const result = language ? getLocaleName(language, locale.value) : undefined;

  return result ?? t('unknown');
}
</script>
