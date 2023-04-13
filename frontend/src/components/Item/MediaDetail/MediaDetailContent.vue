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
      :label="t('mediaInfo.container.name')"
      :value="media.Container" />
    <media-detail-attr
      v-if="media.Path"
      :label="t('mediaInfo.path.name')"
      :value="media.Path" />
    <media-detail-attr
      v-if="media.Size"
      :label="t('mediaInfo.size.name')"
      :value="formatFileSize(media.Size)" />
    <media-detail-attr
      v-if="media.Bitrate"
      :label="t('mediaInfo.bitrate.name')"
      :value="(media.Bitrate / 1000).toFixed(2) + ' kbps'" />
  </div>

  <div class="d-flex flex-row flex-wrap mt-5">
    <div
      v-for="(stream, idx) in videoStreams"
      :key="'mmd-vid-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">{{
          videoStreams.length > 1 ? `Video ${idx + 1}` : 'Video'
        }}</span>
        <media-detail-copy
          :text="
            makeCopyableStreamInfo(stream, idx + 1, videoStreams.length > 1)
          " />
      </h3>
      <media-detail-generic :stream="stream" />
      <media-detail-attr
        :label="t('mediaInfo.videoCodec.isAvc')"
        :value="yesOrNo(stream.IsAVC)" />
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
        v-if="isBool(stream.IsAnamorphic)"
        :label="t('mediaInfo.videoCodec.isAnamorphic')"
        :value="yesOrNo(stream.IsAnamorphic)" />
      <media-detail-attr
        v-if="stream.IsInterlaced"
        :label="t('mediaInfo.videoCodec.isInterlaced')"
        :value="yesOrNo(stream.IsInterlaced)" />
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
        :value="stream.BitDepth" />
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
        :label="t('mediaInfo.videoCodec.DoVi.majorLevel')"
        :value="stream.DvVersionMajor" />
      <media-detail-attr
        v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMinor)"
        :label="t('mediaInfo.videoCodec.DoVi.minorLevel')"
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
      :key="'mmd-aud-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">{{
          audioStreams.length > 1 ? `Audio ${idx + 1}` : 'Audio'
        }}</span>
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
      :key="'mmd-subs-' + stream.Index ?? idx"
      class="stream-info">
      <h3 v-if="media.Name" class="d-block my-2">
        <span class="mr-1">{{
          subsStreams.length > 1 ? `Subtitle ${idx + 1}` : 'Subtitle'
        }}</span>
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
import { formatFileSize, getMediaStreams } from '@/utils/items';

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

const isNumber = (value: unknown): value is number => typeof value === 'number';

const isString = (value: unknown): value is string => typeof value === 'string';

const isBool = (value: unknown): value is boolean => typeof value === 'boolean';

/**
 * Create generic information about the media stream.
 */
function fmtGenericInfo(stream: MediaStream): string {
  let mediaInfo = '';

  if (stream.DisplayTitle) {
    mediaInfo +=
      t('mediaInfo.generic.title') + ' ' + stream.DisplayTitle + '\n';
  }

  if (stream.Language) {
    mediaInfo += t('mediaInfo.generic.language') + ' ' + stream.Language + '\n';
  }

  if (stream.Codec) {
    mediaInfo +=
      t('mediaInfo.generic.codec') + ' ' + stream.Codec.toUpperCase() + '\n';
  }

  if (stream.CodecTag) {
    mediaInfo += t('mediaInfo.generic.codecTag') + ' ' + stream.CodecTag + '\n';
  }

  return mediaInfo;
}

/**
 * Format a boolean value into a Yes/No string.
 */
function yesOrNo(value: boolean | null | undefined): string {
  return value ? 'Yes' : 'No';
}

/**
 * Create generic information about the Default/Forced/External status of a stream.
 */
function fmtDefaultForcedExt(stream: MediaStream): string {
  let mediaInfo = '';

  mediaInfo +=
    t('mediaInfo.generic.default') + ' ' + yesOrNo(stream.IsDefault) + '\n';
  mediaInfo +=
    t('mediaInfo.generic.forced') + ' ' + yesOrNo(stream.IsForced) + '\n';
  mediaInfo +=
    t('mediaInfo.generic.external') + ' ' + yesOrNo(stream.IsExternal) + '\n';

  return mediaInfo;
}

/**
 * Create information about Dolby Vision if exist.
 */
function fmtVideoDoViInfo(stream: MediaStream): string {
  let mediaInfo = '';

  if (!isString(stream.VideoDoViTitle)) {
    return mediaInfo;
  }

  mediaInfo +=
    t('mediaInfo.videoCodec.DoVi.title') + ` ${stream.VideoDoViTitle}\n`;

  if (isNumber(stream.DvVersionMajor)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.majorLevel') + ` ${stream.DvVersionMajor}\n`;
  }

  if (isNumber(stream.DvVersionMinor)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.minorLevel') + ` ${stream.DvVersionMinor}\n`;
  }

  if (isNumber(stream.DvProfile)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.profile') + ` ${stream.DvProfile}\n`;
  }

  if (isNumber(stream.DvLevel)) {
    mediaInfo += t('mediaInfo.videoCodec.DoVi.level') + ` ${stream.DvLevel}\n`;
  }

  if (isNumber(stream.RpuPresentFlag)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.rpuPresent') + ` ${stream.RpuPresentFlag}\n`;
  }

  if (isNumber(stream.ElPresentFlag)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.elPresent') + ` ${stream.ElPresentFlag}\n`;
  }

  if (isNumber(stream.BlPresentFlag)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.blPresent') + ` ${stream.BlPresentFlag}\n`;
  }

  if (isNumber(stream.DvBlSignalCompatibilityId)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.DoVi.blSignalCompatibilityId') +
      ` ${stream.DvBlSignalCompatibilityId}\n`;
  }

  return mediaInfo;
}

/**
 * Create information about the color space used in the video stream.
 */
function fmtVideoColorInfo(stream: MediaStream): string {
  let mediaInfo = '';

  if (stream.ColorSpace) {
    mediaInfo +=
      t('mediaInfo.videoCodec.colorSpace') + ' ' + stream.ColorSpace + '\n';
  }

  if (stream.ColorTransfer) {
    mediaInfo +=
      t('mediaInfo.videoCodec.colorTransfer') +
      ' ' +
      stream.ColorTransfer +
      '\n';
  }

  if (stream.ColorPrimaries) {
    mediaInfo +=
      t('mediaInfo.videoCodec.colorPrimaries') +
      ' ' +
      stream.ColorPrimaries +
      '\n';
  }

  if (stream.ColorRange) {
    mediaInfo +=
      t('mediaInfo.videoCodec.colorRange') + ' ' + stream.ColorRange + '\n';
  }

  if (stream.PixelFormat) {
    mediaInfo +=
      t('mediaInfo.videoCodec.pixelFormat') + ' ' + stream.PixelFormat + '\n';
  }

  return mediaInfo;
}

/**
 * Format video media info into a text format
 */
function fmtVideoMediaInfo(stream: MediaStream): string {
  let mediaInfo = fmtGenericInfo(stream);

  mediaInfo +=
    t('mediaInfo.videoCodec.isAvc') + ' ' + yesOrNo(stream.IsAVC) + '\n';

  if (stream.Profile) {
    mediaInfo += t('mediaInfo.generic.profile') + ' ' + stream.Profile + '\n';
  }

  if (stream.Level) {
    mediaInfo += t('mediaInfo.videoCodec.level') + ' ' + stream.Level + '\n';
  }

  if (stream.Width || stream.Height) {
    mediaInfo +=
      t('mediaInfo.videoCodec.resolution') +
      ` ${stream.Width}x${stream.Height}\n`;
  }

  if (stream.AspectRatio && stream.Codec !== 'mjpeg') {
    mediaInfo +=
      t('mediaInfo.videoCodec.aspectRatio') + ' ' + stream.AspectRatio + '\n';
  }

  if (isBool(stream.IsAnamorphic)) {
    mediaInfo +=
      t('mediaInfo.videoCodec.isAnamorphic') +
      ' ' +
      yesOrNo(stream.IsAnamorphic) +
      '\n';
  }

  mediaInfo +=
    t('mediaInfo.videoCodec.isInterlaced') +
    ' ' +
    yesOrNo(stream.IsInterlaced) +
    '\n';

  if (stream.AverageFrameRate || stream.RealFrameRate) {
    mediaInfo +=
      t('mediaInfo.videoCodec.frameRate') +
      ` ${stream.AverageFrameRate || stream.RealFrameRate} fps\n`;
  }

  if (stream.BitRate) {
    mediaInfo +=
      t('mediaInfo.generic.bitrate') +
      ` ${(stream.BitRate / 1000).toFixed(2)} kbps\n`;
  }

  if (stream.BitDepth) {
    mediaInfo +=
      t('mediaInfo.videoCodec.bitdepth') + ` ${stream.BitDepth} bit\n`;
  }

  if (stream.VideoRange) {
    mediaInfo +=
      t('mediaInfo.videoCodec.videoRange') + ' ' + stream.VideoRange + '\n';
  }

  if (stream.VideoRangeType) {
    mediaInfo +=
      t('mediaInfo.videoCodec.videoRangeType') +
      ' ' +
      stream.VideoRangeType +
      '\n';
  }

  mediaInfo += fmtVideoDoViInfo(stream);
  mediaInfo += fmtVideoColorInfo(stream);

  if (stream.NalLengthSize) {
    mediaInfo += `NAL: ${stream.NalLengthSize}\n`;
  }

  return mediaInfo;
}

/**
 * Format audio media info into a text format
 */
function fmtAudioMediaInfo(stream: MediaStream): string {
  let mediaInfo = fmtGenericInfo(stream);

  if (stream.Profile) {
    mediaInfo += t('mediaInfo.generic.profile') + ' ' + stream.Profile + '\n';
  }

  if (stream.ChannelLayout) {
    mediaInfo +=
      t('mediaInfo.audioCodec.layout') + ' ' + stream.ChannelLayout + '\n';
  }

  if (stream.Channels) {
    mediaInfo +=
      t('mediaInfo.audioCodec.channels') + ` ${stream.Channels} ch\n`;
  }

  if (stream.BitRate) {
    mediaInfo +=
      t('mediaInfo.generic.bitrate') +
      ` ${(stream.BitRate / 1000).toFixed(2)} kbps\n`;
  }

  if (stream.SampleRate) {
    mediaInfo +=
      t('mediaInfo.audioCodec.sampleRate') + ` ${stream.SampleRate} Hz\n`;
  }

  mediaInfo += fmtDefaultForcedExt(stream);

  return mediaInfo;
}

/**
 * Format subtitle media info into a text format
 */
function fmtSubsMediaInfo(stream: MediaStream): string {
  let mediaInfo = fmtGenericInfo(stream);

  mediaInfo += fmtDefaultForcedExt(stream);

  return mediaInfo;
}

const videoMediaInfo = computed<string>(() => {
  let mergedStream = '';
  const more = videoStreams.value.length > 1;

  for (let idx = 1; idx <= videoStreams.value.length; idx++) {
    const stream = videoStreams.value[idx - 1];

    mergedStream += more ? `Video ${idx}\n` : 'Video\n';
    mergedStream += fmtVideoMediaInfo(stream) + '\n';
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
    mergedStream += fmtAudioMediaInfo(stream) + '\n';
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
    mergedStream += fmtSubsMediaInfo(stream) + '\n';
  }

  if (mergedStream) {
    mergedStream = mergedStream.slice(0, -1);
  }

  return mergedStream;
});

const completeMediainfo = computed<string>(() => {
  let mediaInfo = '';
  const { media } = props;

  if (media.Name) {
    mediaInfo += media.Name + '\n';
  }

  if (media.Container) {
    mediaInfo += t('mediaInfo.container.name') + ' ' + media.Container + '\n';
  }

  if (media.Path) {
    mediaInfo += t('mediaInfo.path.name') + ' ' + media.Path + '\n';
  }

  if (media.Size) {
    mediaInfo +=
      t('mediaInfo.size.name') + ' ' + formatFileSize(media.Size) + '\n';
  }

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

      return prefix + fmtVideoMediaInfo(stream);
    }
    case 'Audio': {
      let prefix = hasMore ? `Audio ${streamIndex}\n` : 'Audio\n';

      return prefix + fmtAudioMediaInfo(stream);
    }
    case 'Subtitle': {
      let prefix = hasMore ? `Subtitle ${streamIndex}\n` : 'Subtitle\n';

      return prefix + fmtSubsMediaInfo(stream);
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
