<template>
  <div>
    <h2 v-if="media.Name" class="d-block my-2">
      <span class="mr-1">{{ displayName }}</span>
      <media-detail-copy :text="completeMediainfo" />
    </h2>
  </div>
  <div class="d-flex flex-column mt-2">
    <media-detail-attr
      v-if="media.Container"
      :label="t('mediaInfoFileContainer')"
      :value="media.Container" />
    <media-detail-attr
      v-if="media.Path"
      :label="t('mediaInfoFilePath')"
      :value="media.Path" />
    <media-detail-attr
      v-if="media.Size"
      :label="t('mediaInfoFileSize')"
      :value="formatFileSize(media.Size)" />
    <media-detail-attr
      v-if="media.Bitrate"
      :label="t('mediaInfoGenericBitrate')"
      :value="(media.Bitrate / 1000).toFixed(2) + ' kbps'" />
  </div>

  <div class="d-flex flex-row flex-wrap mt-5">
    <div
      v-for="(stream, idx) in videoStreams"
      :key="'mdinfo-video-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{ t('mediaInfoTitlesVideoCodec', [idx + 1], videoStreams.length) }}
        </span>
        <media-detail-copy
          :text="
            makeSingleMediaStreamInfo(stream, idx + 1, videoStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        :label="t('mediaInfoVideoIsAvc')"
        :value="formatYesOrNo(stream.IsAVC)" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfoGenericProfile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.Level"
        :label="t('mediaInfoVideoLevel')"
        :value="stream.Level" />
      <media-detail-attr
        v-if="stream.Width || stream.Height"
        :label="t('mediaInfoVideoResolution')"
        :value="`${stream.Width}x${stream.Height}`" />
      <media-detail-attr
        v-if="stream.AspectRatio"
        :label="t('mediaInfoVideoAspectRatio')"
        :value="stream.AspectRatio" />
      <media-detail-attr
        v-if="typeof stream.IsAnamorphic === 'boolean'"
        :label="t('mediaInfoVideoIsAnamorphic')"
        :value="formatYesOrNo(stream.IsAnamorphic)" />
      <media-detail-attr
        v-if="stream.IsInterlaced"
        :label="t('mediaInfoVideoIsInterlaced')"
        :value="formatYesOrNo(stream.IsInterlaced)" />
      <media-detail-attr
        v-if="stream.AverageFrameRate || stream.RealFrameRate"
        :label="t('mediaInfoVideoFrameRate')"
        :value="`${(stream.AverageFrameRate || stream.RealFrameRate)?.toFixed(
          3
        )} fps`" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfoGenericBitrate')"
        :value="(stream.BitRate / 1000).toFixed(2) + ' kbps'" />
      <media-detail-attr
        v-if="stream.BitDepth"
        :label="t('mediaInfoVideoBitDepth')"
        :value="stream.BitDepth + ' bits'" />
      <media-detail-attr
        v-if="stream.VideoRange"
        :label="t('mediaInfoVideoRange')"
        :value="stream.VideoRange" />
      <media-detail-attr
        v-if="stream.VideoRangeType"
        :label="t('mediaInfoVideoRangeType')"
        :value="stream.VideoRangeType" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle"
        :label="t('mediaInfoVideoDoViTitle')"
        :value="stream.VideoDoViTitle" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMajor)"
        :label="t('mediaInfoVideoDoViMajorVersion')"
        :value="stream.DvVersionMajor" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMinor)"
        :label="t('mediaInfoVideoDoViMinorVersion')"
        :value="stream.DvVersionMinor" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvProfile)"
        :label="t('mediaInfoVideoDoViProfile')"
        :value="stream.DvProfile" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvLevel)"
        :label="t('mediaInfoVideoDoViLevel')"
        :value="stream.DvLevel" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.RpuPresentFlag)"
        :label="t('mediaInfoVideoDoViRpuPresent')"
        :value="stream.RpuPresentFlag" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.ElPresentFlag)"
        :label="t('mediaInfoVideoDoViElPresent')"
        :value="stream.ElPresentFlag" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.BlPresentFlag)"
        :label="t('mediaInfoVideoDoViBlPresent')"
        :value="stream.BlPresentFlag" />
      <media-detail-attr
        v-if="
          stream.VideoDoViTitle && isNumber(stream.DvBlSignalCompatibilityId)
        "
        :label="t('mediaInfoVideoDoViBlSignalCompatId')"
        :value="stream.DvBlSignalCompatibilityId" />
      <media-detail-color-space :stream="stream" />
      <media-detail-attr
        v-if="stream.NalLengthSize"
        label="NAL"
        :value="stream.NalLengthSize" />
    </div>
    <div
      v-for="(stream, idx) in audioStreams"
      :key="'mdinfo-audio-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{ t('mediaInfoTitlesAudioCodec', [idx + 1], audioStreams.length) }}
        </span>
        <media-detail-copy
          :text="
            makeSingleMediaStreamInfo(stream, idx + 1, audioStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfoGenericProfile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.ChannelLayout"
        :label="t('mediaInfoAudioChannelLayout')"
        :value="stream.ChannelLayout" />
      <media-detail-attr
        v-if="stream.Channels"
        :label="t('mediaInfoAudioChannels')"
        :value="`${stream.Channels} ch`" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfoGenericBitrate')"
        :value="(stream.BitRate / 1000).toFixed(2) + ' kbps'" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfoAudioSampleRate')"
        :value="`${stream.SampleRate} Hz`" />
      <media-detail-extras :stream="stream" />
    </div>
    <div
      v-for="(stream, idx) in subsStreams"
      :key="'mdinfo-subs-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{ t('mediaInfoTitlesSubtitleCodec', [idx + 1], subsStreams.length) }}
        </span>
        <media-detail-copy
          :text="
            makeSingleMediaStreamInfo(stream, idx + 1, subsStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-extras :stream="stream" />
    </div>
    <div
      v-for="(stream, idx) in embeddedStreams"
      :key="'mdinfo-embedImg-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{
            t(
              'mediaInfoTitlesEmbeddedImageCodec',
              [idx + 1],
              embeddedStreams.length
            )
          }}
        </span>
        <media-detail-copy
          :text="
            makeSingleMediaStreamInfo(stream, idx + 1, embeddedStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfoGenericProfile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.Width || stream.Height"
        :label="t('mediaInfoVideoResolution')"
        :value="`${stream.Width}x${stream.Height}`" />
      <media-detail-attr
        v-if="stream.BitDepth"
        :label="t('mediaInfoVideoBitDepth')"
        :value="stream.BitDepth + ' bits'" />
      <media-detail-color-space :stream="stream" />
      <media-detail-attr
        v-if="stream.RefFrames"
        :label="t('mediaInfoVideoRefFrames')"
        :value="stream.RefFrames" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { formatFileSize, getMediaStreams } from '@/utils/items';
import {
  formatYesOrNo,
  createVideoInformation,
  createAudioInformation,
  createSubsInformation,
  createContainerInformation,
  createEmbeddedInformation
} from '@/utils/mediainfo';

const props = defineProps<{
  media: MediaSourceInfo;
  parentName?: string;
}>();

const { t } = useI18n();

const videoStreams = computed<MediaStream[]>(() =>
  getMediaStreams(props.media.MediaStreams ?? [], 'Video')
);
const audioStreams = computed<MediaStream[]>(() =>
  getMediaStreams(props.media.MediaStreams ?? [], 'Audio')
);
const subsStreams = computed<MediaStream[]>(() =>
  getMediaStreams(props.media.MediaStreams ?? [], 'Subtitle')
);
const embeddedStreams = computed<MediaStream[]>(() =>
  getMediaStreams(props.media.MediaStreams ?? [], 'EmbeddedImage')
);
const displayName = computed(() => {
  if (props.parentName) {
    return `${props.parentName} - ${props.media.Name}`;
  }

  return props.media.Name;
});
const completeMediainfo = computed<string>(() => {
  let mediaInfo = '';
  const { media } = props;

  if (displayName.value) {
    mediaInfo += `${displayName.value}\n`;
  }

  mediaInfo += createContainerInformation(media);

  if (mediaInfo) {
    mediaInfo += '\n';
  }

  mediaInfo += makeBulkMediaStreamsInfo(videoStreams.value);
  mediaInfo += makeBulkMediaStreamsInfo(audioStreams.value);
  mediaInfo += makeBulkMediaStreamsInfo(subsStreams.value);
  mediaInfo += makeBulkMediaStreamsInfo(embeddedStreams.value);

  return mediaInfo.trimEnd();
});

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

/**
 * Creates a Media info string from a collection of `MediaStream`.
 *
 * @param streams - The collection of `MediaStream` to create the string from.
 * @param type - The type of the stream.
 * @param stringfier - The function that creates the string for each stream.
 */
function makeBulkMediaStreamsInfo(streams: MediaStream[]): string {
  let mergedStream = '';

  for (let idx = 1; idx <= streams.length; idx++) {
    const stream = streams[idx - 1];

    mergedStream +=
      makeSingleMediaStreamInfo(stream, idx, streams.length) + '\n';
  }

  return mergedStream;
}

/**
 * Make a copyable stream information data
 */
function makeSingleMediaStreamInfo(
  stream: MediaStream,
  streamIndex: number,
  totalLength: number
): string {
  switch (stream.Type) {
    case 'Video': {
      return (
        t('mediaInfoTitlesVideoCodec', [streamIndex], totalLength) +
        '\n' +
        createVideoInformation(stream)
      );
    }
    case 'Audio': {
      return (
        t('mediaInfoTitlesAudioCodec', [streamIndex], totalLength) +
        '\n' +
        createAudioInformation(stream)
      );
    }
    case 'Subtitle': {
      return (
        t('mediaInfoTitlesSubtitleCodec', [streamIndex], totalLength) +
        '\n' +
        createSubsInformation(stream)
      );
    }
    case 'EmbeddedImage': {
      return (
        t('mediaInfoTitlesEmbeddedImageCodec', [streamIndex], totalLength) +
        '\n' +
        createEmbeddedInformation(stream)
      );
    }
    default: {
      return '';
    }
  }
}
</script>

<style lang="scss" scoped>
.stream-info {
  display: inline-block;
  vertical-align: top;
  margin-right: 3rem;
  margin-top: 0.5rem;
}
</style>
