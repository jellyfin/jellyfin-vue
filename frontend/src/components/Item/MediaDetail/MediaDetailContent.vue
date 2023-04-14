<template>
  <div>
    <h2 v-if="media.Name" class="d-block my-2">
      <span class="mr-1">{{ media.Name }}</span>
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
          {{ videoStreams.length > 1 ? `Video ${idx + 1}` : 'Video' }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, videoStreams.length > 1)
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
        v-if="isBoolean(stream.IsAnamorphic)"
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
      <media-detail-attr
        v-if="stream.ColorSpace"
        :label="t('mediaInfo.videoCodec.colorSpace')"
        :value="stream.ColorSpace" />
      <media-detail-attr
        v-if="stream.ColorTransfer"
        :label="t('mediaInfo.videoCodec.colorTransfer')"
        :value="stream.ColorTransfer" />
      <media-detail-attr
        v-if="stream.ColorPrimaries"
        :label="t('mediaInfo.videoCodec.colorPrimaries')"
        :value="stream.ColorPrimaries" />
      <media-detail-attr
        v-if="stream.ColorRange"
        :label="t('mediaInfo.videoCodec.colorRange')"
        :value="stream.ColorRange" />
      <media-detail-attr
        v-if="stream.PixelFormat"
        :label="t('mediaInfo.videoCodec.pixelFormat')"
        :value="stream.PixelFormat" />
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
          {{ audioStreams.length > 1 ? `Audio ${idx + 1}` : 'Audio' }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, audioStreams.length > 1)
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
          {{ subsStreams.length > 1 ? `Subtitle ${idx + 1}` : 'Subtitle' }}
        </span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, subsStreams.length > 1)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-extras :stream="stream" />
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
import { isNumber, isBoolean } from 'lodash-es';
import { formatFileSize, getMediaStreams } from '@/utils/items';
import {
  formatYesOrNo,
  createVideoInformation,
  createAudioInformation,
  createSubsInformation,
  createContainerInformation
} from '@/utils/mediainfo';

const props = defineProps<{
  media: MediaSourceInfo;
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

const videoMediaInfo = computed<string>(() => {
  let mergedStream = '';
  const more = videoStreams.value.length > 1;

  for (let idx = 1; idx <= videoStreams.value.length; idx++) {
    const stream = videoStreams.value[idx - 1];

    mergedStream += more ? `Video ${idx}\n` : 'Video\n';
    mergedStream += createVideoInformation(stream) + '\n';
  }

  if (mergedStream) {
    mergedStream = mergedStream.slice(0, -1);
  }

  return mergedStream;
});

const audioMediaInfo = computed<string>(() => {
  let mergedStream = '';
  const more = audioStreams.value.length > 1;

  for (let idx = 1; idx <= audioStreams.value.length; idx++) {
    const stream = audioStreams.value[idx - 1];

    mergedStream += more ? `Audio ${idx}\n` : 'Audio\n';
    mergedStream += createAudioInformation(stream) + '\n';
  }

  if (mergedStream) {
    mergedStream = mergedStream.slice(0, -1);
  }

  return mergedStream;
});

const subsMediaInfo = computed<string>(() => {
  let mergedStream = '';
  const more = subsStreams.value.length > 1;

  for (let idx = 1; idx <= subsStreams.value.length; idx++) {
    const stream = subsStreams.value[idx - 1];

    mergedStream += more ? `Subtitle ${idx}\n` : 'Subtitle\n';
    mergedStream += createSubsInformation(stream) + '\n';
  }

  if (mergedStream) {
    mergedStream = mergedStream.slice(0, -1);
  }

  return mergedStream;
});

const completeMediainfo = computed<string>(() => {
  let mediaInfo = '';
  const { media } = props;

  mediaInfo += createContainerInformation(media);

  if (mediaInfo) {
    mediaInfo += '\n';
  }

  mediaInfo += videoMediaInfo.value;

  if (mediaInfo) {
    mediaInfo += '\n';
  }

  mediaInfo += audioMediaInfo.value;

  if (mediaInfo) {
    mediaInfo += '\n';
  }

  mediaInfo += subsMediaInfo.value;

  return mediaInfo;
});

/**
 * Make a copyable stream information data
 */
function makeCopyableStreamInfo(
  stream: MediaStream,
  streamIndex: number,
  hasMore: boolean
): string {
  switch (stream.Type) {
    case 'Video': {
      let prefix = hasMore ? `Video ${streamIndex}\n` : 'Video\n';

      return prefix + createVideoInformation(stream);
    }
    case 'Audio': {
      let prefix = hasMore ? `Audio ${streamIndex}\n` : 'Audio\n';

      return prefix + createAudioInformation(stream);
    }
    case 'Subtitle': {
      let prefix = hasMore ? `Subtitle ${streamIndex}\n` : 'Subtitle\n';

      return prefix + createSubsInformation(stream);
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
