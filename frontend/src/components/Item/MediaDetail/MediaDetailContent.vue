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
      :label="t('mediaInfo.generic.container')"
      :value="media.Container" />
    <media-detail-attr
      v-if="media.Path"
      :label="t('mediaInfo.generic.path')"
      :value="media.Path" />
    <media-detail-attr
      v-if="media.Size"
      :label="t('mediaInfo.generic.size')"
      :value="formatFileSize(media.Size)" />
    <media-detail-attr
      v-if="media.Bitrate"
      :label="t('mediaInfo.generic.bitrate')"
      :value="(media.Bitrate / 1000).toFixed(2) + ' kbps'" />
  </div>

  <div class="d-flex flex-row flex-wrap mt-5">
    <div
      v-for="(stream, idx) in videoStreams"
      :key="'mdinfo-video-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{ t('mediaInfo.videoCodec.titles', [idx + 1], videoStreams.length) }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, videoStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        :label="t('mediaInfo.videoCodec.isAvc')"
        :value="formatYesOrNo(stream.IsAVC)" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfo.generic.profile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.Level"
        :label="t('mediaInfo.videoCodec.level')"
        :value="stream.Level" />
      <media-detail-attr
        v-if="stream.Width || stream.Height"
        :label="t('mediaInfo.videoCodec.resolution')"
        :value="`${stream.Width}x${stream.Height}`" />
      <media-detail-attr
        v-if="stream.AspectRatio"
        :label="t('mediaInfo.videoCodec.aspectRatio')"
        :value="stream.AspectRatio" />
      <media-detail-attr
        v-if="typeof stream.IsAnamorphic === 'boolean'"
        :label="t('mediaInfo.videoCodec.isAnamorphic')"
        :value="formatYesOrNo(stream.IsAnamorphic)" />
      <media-detail-attr
        v-if="stream.IsInterlaced"
        :label="t('mediaInfo.videoCodec.isInterlaced')"
        :value="formatYesOrNo(stream.IsInterlaced)" />
      <media-detail-attr
        v-if="stream.AverageFrameRate || stream.RealFrameRate"
        :label="t('mediaInfo.videoCodec.frameRate')"
        :value="`${(stream.AverageFrameRate || stream.RealFrameRate)?.toFixed(
          3
        )} fps`" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfo.generic.bitrate')"
        :value="(stream.BitRate / 1000).toFixed(2) + ' kbps'" />
      <media-detail-attr
        v-if="stream.BitDepth"
        :label="t('mediaInfo.videoCodec.bitdepth')"
        :value="stream.BitDepth + ' bits'" />
      <media-detail-attr
        v-if="stream.VideoRange"
        :label="t('mediaInfo.videoCodec.videoRange')"
        :value="stream.VideoRange" />
      <media-detail-attr
        v-if="stream.VideoRangeType"
        :label="t('mediaInfo.videoCodec.videoRangeType')"
        :value="stream.VideoRangeType" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle"
        :label="t('mediaInfo.videoCodec.DoVi.title')"
        :value="stream.VideoDoViTitle" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMajor)"
        :label="t('mediaInfo.videoCodec.DoVi.majorVersion')"
        :value="stream.DvVersionMajor" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMinor)"
        :label="t('mediaInfo.videoCodec.DoVi.minorVersion')"
        :value="stream.DvVersionMinor" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvProfile)"
        :label="t('mediaInfo.videoCodec.DoVi.profile')"
        :value="stream.DvProfile" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvLevel)"
        :label="t('mediaInfo.videoCodec.DoVi.level')"
        :value="stream.DvLevel" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.RpuPresentFlag)"
        :label="t('mediaInfo.videoCodec.DoVi.rpuPresent')"
        :value="stream.RpuPresentFlag" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.ElPresentFlag)"
        :label="t('mediaInfo.videoCodec.DoVi.elPresent')"
        :value="stream.ElPresentFlag" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.BlPresentFlag)"
        :label="t('mediaInfo.videoCodec.DoVi.blPresent')"
        :value="stream.BlPresentFlag" />
      <media-detail-attr
        v-if="
          stream.VideoDoViTitle && isNumber(stream.DvBlSignalCompatibilityId)
        "
        :label="t('mediaInfo.videoCodec.DoVi.blSignalCompatibilityId')"
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
          {{ t('mediaInfo.audioCodec.titles', [idx + 1], audioStreams.length) }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, audioStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfo.generic.profile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.ChannelLayout"
        :label="t('mediaInfo.audioCodec.layout')"
        :value="stream.ChannelLayout" />
      <media-detail-attr
        v-if="stream.Channels"
        :label="t('mediaInfo.audioCodec.channels')"
        :value="`${stream.Channels} ch`" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfo.generic.bitrate')"
        :value="(stream.BitRate / 1000).toFixed(2) + ' kbps'" />
      <media-detail-attr
        v-if="stream.BitRate"
        :label="t('mediaInfo.audioCodec.sampleRate')"
        :value="`${stream.SampleRate} Hz`" />
      <media-detail-extras :stream="stream" />
    </div>
    <div
      v-for="(stream, idx) in subsStreams"
      :key="'mdinfo-subs-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">
          {{
            t('mediaInfo.subtitleCodec.titles', [idx + 1], subsStreams.length)
          }}
        </span>
        <media-detail-copy
          :text="makeCopyableStreamInfo(stream, idx + 1, subsStreams.length)" />
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
              'mediaInfo.embeddedImageCodec.titles',
              [idx + 1],
              embeddedStreams.length
            )
          }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, embeddedStreams.length)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        v-if="stream.Profile"
        :label="t('mediaInfo.generic.profile')"
        :value="stream.Profile" />
      <media-detail-attr
        v-if="stream.Width || stream.Height"
        :label="t('mediaInfo.videoCodec.resolution')"
        :value="`${stream.Width}x${stream.Height}`" />
      <media-detail-attr
        v-if="stream.BitDepth"
        :label="t('mediaInfo.videoCodec.bitdepth')"
        :value="stream.BitDepth + ' bits'" />
      <media-detail-color-space :stream="stream" />
      <media-detail-attr
        v-if="stream.RefFrames"
        :label="t('mediaInfo.videoCodec.refFrames')"
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

/**
 * Creates a Media info string from a collection of `MediaStream`.
 *
 * @param streams - The collection of `MediaStream` to create the string from.
 * @param type - The type of the stream.
 * @param stringfier - The function that creates the string for each stream.
 */
function makeMediaStreamInfo(
  streams: MediaStream[],
  type: string,
  stringfier: (stream: MediaStream) => string
): string {
  let mergedStream = '';

  for (let idx = 1; idx <= streams.length; idx++) {
    const stream = streams[idx - 1];

    const title = t(`mediaInfo.${type}.titles`, [idx], streams.length);

    mergedStream += `${title}\n`;
    mergedStream += stringfier(stream) + '\n';
  }

  return mergedStream;
}

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

  mediaInfo += makeMediaStreamInfo(
    videoStreams.value,
    'videoCodec',
    createVideoInformation
  );
  mediaInfo += makeMediaStreamInfo(
    audioStreams.value,
    'audioCodec',
    createAudioInformation
  );
  mediaInfo += makeMediaStreamInfo(
    subsStreams.value,
    'subtitleCodec',
    createSubsInformation
  );
  mediaInfo += makeMediaStreamInfo(
    embeddedStreams.value,
    'embeddedImageCodec',
    createEmbeddedInformation
  );

  return mediaInfo;
});

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

/**
 * Make a copyable stream information data
 */
function makeCopyableStreamInfo(
  stream: MediaStream,
  streamIndex: number,
  totalLength: number
): string {
  switch (stream.Type) {
    case 'Video': {
      return (
        t('mediaInfo.videoCodec.titles', [streamIndex], totalLength) +
        '\n' +
        createVideoInformation(stream)
      );
    }
    case 'Audio': {
      return (
        t('mediaInfo.audioCodec.titles', [streamIndex], totalLength) +
        '\n' +
        createAudioInformation(stream)
      );
    }
    case 'Subtitle': {
      return (
        t('mediaInfo.subtitleCodec.titles', [streamIndex], totalLength) +
        '\n' +
        createSubsInformation(stream)
      );
    }
    case 'EmbeddedImage': {
      return (
        t('mediaInfo.embeddedImageCodec.titles', [streamIndex], totalLength) +
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
