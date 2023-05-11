<template>
  <generic-dialog
    :model-value="model"
    :title="$t('mediaInfo')"
    @close="
      [
        () => {
          model = false;
          emit('close');
        }
      ]
    ">
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

    <v-card-text
      v-if="selectedMediaSource"
      class="pa-3 d-flex flex-column flex-grow-1">
      <template v-if="(selectedMediaSource.MediaStreams?.length ?? 0) > 0">
        <v-tabs v-model="currentTab" direction="horizontal" center-active>
          <v-tab value="general">{{ $t('general') }}</v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsVideo"
            :key="'mediaStreamTabVideo' + idx"
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
            :key="'mediaStreamTabAudio' + idx"
            :value="`audio-${idx}`">
            {{
              t(
                'mediaInfoTitlesAudioCodec',
                [idx + 1],
                selectedMediaStreamsAudio.length
              )
            }}
            {{
              selectedMediaStreamsAudio[idx].Language
                ? ' (' + selectedMediaStreamsAudio[idx].Language + ')'
                : ''
            }}
          </v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsSubs"
            :key="'mediaStreamTabSubs' + idx"
            :value="`subs-${idx}`">
            {{
              t(
                'mediaInfoTitlesSubtitleCodec',
                [idx + 1],
                selectedMediaStreamsSubs.length
              )
            }}
            {{
              selectedMediaStreamsSubs[idx].Language
                ? ' (' + selectedMediaStreamsSubs[idx].Language + ')'
                : ''
            }}
          </v-tab>
          <v-tab
            v-for="(_, idx) in selectedMediaStreamsImage"
            :key="'mediaStreamTabImage' + idx"
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
          <v-window-item value="general" class="stream-info">
            <h2 v-if="selectedMediaSource.Name" class="d-block my-2">
              <span class="mr-1">{{ displayName }}</span>
            </h2>
            <media-detail-attr
              v-if="selectedMediaSource.Container"
              :name="t('mediaInfoFileContainer')"
              :value="selectedMediaSource.Container" />
            <media-detail-attr
              v-if="
                Array.isArray(selectedMediaSource.Formats) &&
                selectedMediaSource.Formats.length > 0
              "
              :name="t('mediaInfoFileFormats')"
              :value="selectedMediaSource.Formats.join(',')" />
            <media-detail-attr
              v-if="selectedMediaSource.Path"
              :name="t('mediaInfoFilePath')"
              :value="selectedMediaSource.Path" />
            <media-detail-attr
              v-if="selectedMediaSource.Size"
              :name="t('mediaInfoFileSize')"
              :value="formatFileSize(selectedMediaSource.Size)" />
            <media-detail-attr
              v-if="selectedMediaSource.Bitrate"
              :name="t('mediaInfoGenericBitrate')"
              :value="
                (selectedMediaSource.Bitrate / 1000).toFixed(2) + ' kbps'
              " />
          </v-window-item>
          <!-- We need to separate between item types, because some weird thing would happen without it. -->
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsVideo"
            :key="'mediaStreamTabWVideo' + idx"
            :value="`video-${idx}`"
            class="stream-info">
            <h3 class="d-block my-2">
              {{
                t(
                  'mediaInfoTitlesVideoCodec',
                  [idx + 1],
                  selectedMediaStreamsVideo.length
                )
              }}
            </h3>
            <media-detail-content
              :stream="mediaStream"
              :video-timestamp="selectedMediaSource.Timestamp" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsAudio"
            :key="'mediaStreamTabWAudio' + idx"
            :value="`audio-${idx}`"
            class="stream-info">
            <h3 class="d-block my-2">
              {{
                t(
                  'mediaInfoTitlesAudioCodec',
                  [idx + 1],
                  selectedMediaStreamsAudio.length
                )
              }}
            </h3>
            <media-detail-content :stream="mediaStream" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsSubs"
            :key="'mediaStreamTabWSubs' + idx"
            :value="`subs-${idx}`"
            class="stream-info">
            <h3 class="d-block my-2">
              {{
                t(
                  'mediaInfoTitlesSubtitleCodec',
                  [idx + 1],
                  selectedMediaStreamsSubs.length
                )
              }}
            </h3>
            <media-detail-content :stream="mediaStream" />
          </v-window-item>
          <v-window-item
            v-for="(mediaStream, idx) in selectedMediaStreamsImage"
            :key="'mediaStreamTabWEmbedImage' + idx"
            :value="`image-${idx}`"
            class="stream-info">
            <h3 class="d-block my-2">
              {{
                t(
                  'mediaInfoTitlesEmbeddedImageCodec',
                  [idx + 1],
                  selectedMediaStreamsImage.length
                )
              }}
            </h3>
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
import {
  BaseItemDto,
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { formatFileSize } from '@/utils/items';

const props = defineProps<{ item: BaseItemDto; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();

const model = ref(true);
const currentTab = ref<string>();
const mediaSources = computed<MediaSourceInfo[]>(() => {
  return props.item.MediaSources ?? [];
});
const displayName = computed<string | undefined>(() => {
  if ((props.item.MediaSources?.length ?? 0) > 1) {
    const parent = props.item.Name;

    if (parent) {
      return `${parent} - ${selectedMediaSource.value?.Name ?? ''}`;
    }
  }

  return selectedMediaSource.value?.Name ?? undefined;
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
</script>

<style lang="scss" scoped>
.stream-info {
  display: inline-block;
  vertical-align: top;
  margin-right: 3rem;
  margin-top: 0.5rem;
}
</style>
