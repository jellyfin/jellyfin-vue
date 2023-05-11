<template>
  <media-detail-attr
    v-if="stream.DisplayTitle"
    :name="t('mediaInfoFileTitle')"
    :value="stream.DisplayTitle" />
  <media-detail-attr
    v-if="stream.Language && stream.Type !== 'Video'"
    :name="t('mediaInfoGenericLanguage')"
    :value="stream.Language" />
  <media-detail-attr
    v-if="stream.Codec"
    :name="t('mediaInfoGenericCodec')"
    :value="stream.Codec.toUpperCase()" />
  <media-detail-attr
    v-if="stream.CodecTag"
    :name="t('mediaInfoGenericCodecTag')"
    :value="stream.CodecTag" />
  <media-detail-attr
    v-if="isBool(stream.IsAVC)"
    :name="t('mediaInfoVideoIsAvc')"
    :value="stream.IsAVC" />
  <media-detail-attr
    v-if="stream.Profile"
    :name="t('mediaInfoGenericProfile')"
    :value="stream.Profile" />
  <media-detail-attr
    v-if="(stream.Level ?? 0) > 0"
    :name="t('mediaInfoVideoLevel')"
    :value="stream.Level ?? 0" />
  <media-detail-attr
    v-if="stream.Width || stream.Height"
    :name="t('mediaInfoVideoResolution')"
    :value="`${stream.Width}x${stream.Height}`" />
  <media-detail-attr
    v-if="stream.AspectRatio && stream.Codec !== 'mjpeg'"
    :name="t('mediaInfoVideoAspectRatio')"
    :value="stream.AspectRatio" />
  <media-detail-attr
    v-if="typeof stream.IsAnamorphic === 'boolean' && stream.Type === 'Video'"
    :name="t('mediaInfoVideoIsAnamorphic')"
    :value="stream.IsAnamorphic" />
  <media-detail-attr
    v-if="stream.Type === 'Video'"
    :name="t('mediaInfoVideoScanType')"
    :value="
      stream.IsInterlaced
        ? t('mediaInfoVideoScanInterlaced')
        : t('mediaInfoVideoScanProgressive')
    " />
  <media-detail-attr
    v-if="
      (stream.AverageFrameRate || stream.RealFrameRate) &&
      stream.Type === 'Video'
    "
    :name="t('mediaInfoVideoFrameRate')"
    :value="`${(stream.AverageFrameRate || stream.RealFrameRate)?.toFixed(
      3
    )} fps`" />
  <media-detail-attr
    v-if="stream.BitRate"
    :name="t('mediaInfoGenericBitrate')"
    :value="(stream.BitRate / 1000).toFixed(2) + ' kbps'" />
  <media-detail-attr
    v-if="stream.BitDepth"
    :name="t('mediaInfoVideoBitDepth')"
    :value="stream.BitDepth + ' bits'" />
  <media-detail-attr
    v-if="stream.VideoRange"
    :name="t('mediaInfoVideoRange')"
    :value="stream.VideoRange" />
  <media-detail-attr
    v-if="stream.VideoRangeType"
    :name="t('mediaInfoVideoRangeType')"
    :value="stream.VideoRangeType" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle"
    :name="t('mediaInfoVideoDoViTitle')"
    :value="stream.VideoDoViTitle" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMajor)"
    :name="t('mediaInfoVideoDoViMajorVersion')"
    :value="stream.DvVersionMajor" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.DvVersionMinor)"
    :name="t('mediaInfoVideoDoViMinorVersion')"
    :value="stream.DvVersionMinor" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.DvProfile)"
    :name="t('mediaInfoVideoDoViProfile')"
    :value="stream.DvProfile" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.DvLevel)"
    :name="t('mediaInfoVideoDoViLevel')"
    :value="stream.DvLevel" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.RpuPresentFlag)"
    :name="t('mediaInfoVideoDoViRpuPresent')"
    :value="stream.RpuPresentFlag" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.ElPresentFlag)"
    :name="t('mediaInfoVideoDoViElPresent')"
    :value="stream.ElPresentFlag" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.BlPresentFlag)"
    :name="t('mediaInfoVideoDoViBlPresent')"
    :value="stream.BlPresentFlag" />
  <media-detail-attr
    v-if="stream.VideoDoViTitle && isNumber(stream.DvBlSignalCompatibilityId)"
    :name="t('mediaInfoVideoDoViBlSignalCompatId')"
    :value="stream.DvBlSignalCompatibilityId" />
  <media-detail-attr
    v-if="stream.ColorSpace"
    :name="t('mediaInfoVideoColorSpace')"
    :value="stream.ColorSpace" />
  <media-detail-attr
    v-if="stream.ColorTransfer"
    :name="t('mediaInfoVideoColorTransfer')"
    :value="stream.ColorTransfer" />
  <media-detail-attr
    v-if="stream.ColorPrimaries"
    :name="t('mediaInfoVideoColorPrimaries')"
    :value="stream.ColorPrimaries" />
  <media-detail-attr
    v-if="stream.ColorRange"
    :name="t('mediaInfoVideoColorRange')"
    :value="stream.ColorRange" />
  <media-detail-attr
    v-if="stream.PixelFormat"
    :name="t('mediaInfoVideoPixelFormat')"
    :value="stream.PixelFormat" />
  <media-detail-attr
    v-if="stream.RefFrames"
    :name="t('mediaInfoVideoRefFrames')"
    :value="stream.RefFrames" />
  <media-detail-attr
    v-if="stream.NalLengthSize"
    name="NAL:"
    :value="stream.NalLengthSize" />
  <media-detail-attr
    v-if="stream.Type === 'Subtitle' || stream.Type === 'Audio'"
    :name="t('mediaInfoGenericIsDefault')"
    :value="stream.IsDefault ?? false" />
  <media-detail-attr
    v-if="stream.Type === 'Subtitle' || stream.Type === 'Audio'"
    :name="t('mediaInfoGenericIsForced')"
    :value="stream.IsForced ?? false" />
  <media-detail-attr
    v-if="stream.Type === 'Subtitle' || stream.Type === 'Audio'"
    :name="t('mediaInfoGenericIsExternal')"
    :value="stream.IsExternal ?? false" />
  <media-detail-attr
    v-if="videoTimestamp"
    :name="t('mediaInfoVideoTimestamp')"
    :value="videoTimestamp" />
</template>

<script setup lang="ts">
import {
  MediaStream,
  TransportStreamTimestamp
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{
  stream: MediaStream;
  videoTimestamp?: TransportStreamTimestamp;
}>();

const { t } = useI18n();

/**
 * Check if the value is a number.
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Check if the value is a boolean.
 */
function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
</script>
