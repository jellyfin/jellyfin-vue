<template>
  <GenericDialog
    :model-value="model"
    :title="displayName"
    @close="close">
    <template v-if="mediaSources.length > 1 && isNil(mediaSourceIndex)">
      <VCardText>
        <MediaSourceSelector
          class="pt-2"
          :default-source-index="selectedMediaSourceIndex"
          :sources="mediaSources"
          :label="t('selectVersion')"
          @input="selectedMediaSourceIndex = $event" />
      </VCardText>
      <VDivider />
    </template>

    <template v-if="generalProperties">
      <VContainer>
        <template v-for="[key, val] of generalProperties">
          <MediaDetailAttr
            v-if="!isNil(val)"
            :key="key"
            :name="key"
            :value="val" />
        </template>
      </VContainer>
    </template>

    <VCardText
      v-if="selectedMediaSource"
      class="d-flex flex-grow-1 flex-column pa-3">
      <template v-if="(selectedMediaSource.MediaStreams?.length ?? 0) > 0">
        <VTabs
          v-model="currentTab"
          direction="horizontal"
          center-active>
          <VTab
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
          </VTab>
          <VTab
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
          </VTab>
          <VTab
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
          </VTab>
          <VTab
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
          </VTab>
        </VTabs>
        <VWindow
          v-model="currentTab"
          class="pa-2 flex-fill">
          <VWindowItem
            v-for="(mediaStream, idx) in selectedMediaStreamsVideo"
            :key="`mediaStreamTabWVideo-${idx}-${String(mediaStream)}`"
            :value="`video-${idx}`">
            <MediaDetailContent
              :stream="mediaStream"
              :video-timestamp="selectedMediaSource.Timestamp" />
          </VWindowItem>
          <VWindowItem
            v-for="(mediaStream, idx) in selectedMediaStreamsAudio"
            :key="`mediaStreamTabWAudio-${idx}-${String(mediaStream)}`"
            :value="`audio-${idx}`">
            <MediaDetailContent :stream="mediaStream" />
          </VWindowItem>
          <VWindowItem
            v-for="(mediaStream, idx) in selectedMediaStreamsSubs"
            :key="`mediaStreamTabWSubs-${idx}-${String(mediaStream)}`"
            :value="`subs-${idx}`">
            <MediaDetailContent :stream="mediaStream" />
          </VWindowItem>
          <VWindowItem
            v-for="(mediaStream, idx) in selectedMediaStreamsImage"
            :key="`mediaStreamTabWEmbedImage-${idx}-${String(mediaStream)}`"
            :value="`image-${idx}`">
            <MediaDetailContent :stream="mediaStream" />
          </VWindowItem>
        </VWindow>
      </template>
      <h2
        v-else
        class="text-center no-media">
        {{ t('NoMediaStreamsAvailable') }}
      </h2>
    </VCardText>
    <VCardText
      v-else
      class="pa-0 flex-grow-1 pb-8"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <h2 class="no-media">
        {{ t('NoMediaSourcesAvailable') }}
      </h2>
    </VCardText>
  </GenericDialog>
</template>

<script setup lang="ts">
import type {
  BaseItemDto,
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isArray, isNil, isNumber } from '@jellyfin-vue/shared/validation';
import { getLocaleName } from '#/utils/i18n';
import { formatBitRate, formatFileSize } from '#/utils/items';

const { item, mediaSourceIndex } = defineProps<{ item: BaseItemDto; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  close: [];
}>();

const { t, i18next } = useTranslation();

const model = defineModel<boolean>({ default: true });
const currentTab = ref<string>();

/**
 * Closes the dialog and kills the DOM element.
 */
function close(): void {
  model.value = false;
  emit('close');
}

const mediaSources = computed<MediaSourceInfo[]>(() => {
  return item.MediaSources ?? [];
});

const selectedMediaSourceIndex = ref<number>(mediaSourceIndex ?? 0);
const selectedMediaSource = computed<MediaSourceInfo | undefined>(
  () => mediaSources.value[selectedMediaSourceIndex.value] ?? undefined
);
const selectedMediaStreamsVideo = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    s => s.Type === 'Video'
  )
);
const selectedMediaStreamsAudio = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    s => s.Type === 'Audio'
  )
);
const selectedMediaStreamsSubs = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    s => s.Type === 'Subtitle'
  )
);
const selectedMediaStreamsImage = computed<MediaStream[]>(() =>
  (selectedMediaSource.value?.MediaStreams ?? []).filter(
    s => s.Type === 'EmbeddedImage'
  )
);

const displayName = computed(() => {
  if ((item.MediaSources?.length ?? 0) > 1) {
    const parent = item.Name;

    if (parent) {
      return `${parent} - ${selectedMediaSource.value?.Name ?? ''}`;
    }
  }

  return selectedMediaSource.value?.Name ?? t('mediaInfo');
});
const generalProperties = computed(() => {
  if (selectedMediaSource.value) {
    const p = new Map<string, string | number | boolean | null | undefined>();
    const formats
      = isArray(selectedMediaSource.value.Formats)
        && selectedMediaSource.value.Formats.length
        ? selectedMediaSource.value.Formats.join(',')
        : undefined;
    const fileSize = isNumber(selectedMediaSource.value.Size)
      ? formatFileSize(selectedMediaSource.value.Size)
      : undefined;
    const bitrate
      = isNumber(selectedMediaSource.value.Bitrate)
        && selectedMediaSource.value.Bitrate > 0
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
  const result = language ? getLocaleName(language, i18next.language) : undefined;

  return result ?? t('unknown');
}
</script>
