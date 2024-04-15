<template>
  <template v-for="[key, val] of properties">
    <MediaDetailAttr
      v-if="(isNumber(val) && val > 0) || isBool(val) || val"
      :key="key"
      :name="key"
      :value="val" />
  </template>
</template>

<script setup lang="ts">
/**
 * TODO: Determine proper descriptions for all the media info tranbslation keys provided to the user.
 * The used keys are directly taken from Jellyfin Web and they are difficult to understand.
 */
import { computed } from 'vue';
import type {
  MediaStream,
  TransportStreamTimestamp
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { isBool, isNumber } from '@/utils/validation';
import { getLocaleName } from '@/utils/i18n';
import { formatBitRate } from '@/utils/items';

const props = defineProps<{
  stream: MediaStream;
  videoTimestamp?: TransportStreamTimestamp;
}>();

const { t, locale } = useI18n();

const properties = computed(() => {
  const p = new Map<string, string | number | boolean | null | undefined>();
  const resolution
    = props.stream.Width && props.stream.Height
      ? `${props.stream.Width}x${props.stream.Height}`
      : undefined;
  const framerate = props.stream.AverageFrameRate ?? props.stream.RealFrameRate;
  const language = props.stream.Language
    ? getLocaleName(props.stream.Language, locale.value)
    : undefined;

  p.set(t('mediaInfoFileTitle'), props.stream.DisplayTitle);
  p.set(t('mediaInfoGenericLanguage'), language);
  p.set(t('mediaInfoGenericCodec'), props.stream.Codec?.toUpperCase());
  p.set(t('mediaInfoGenericCodecTag'), props.stream.CodecTag);
  p.set(t('mediaInfoGenericProfile'), props.stream.Profile);
  p.set(t('mediaInfoVideoLevel'), props.stream.Level);
  p.set(t('mediaInfoVideoResolution'), resolution);
  p.set(t('mediaInfoAspectRatio'), props.stream.AspectRatio);
  p.set(t('mediaInfoVideoIsAnamorphic'), props.stream.IsAnamorphic);
  p.set(
    t('mediaInfoVideoScanType'),
    props.stream.IsInterlaced
      ? t('mediaInfoVideoScanInterlaced')
      : t('mediaInfoVideoScanProgressive')
  );
  p.set(
    t('mediaInfoVideoFrameRate'),
    isNumber(framerate) && framerate > 0
      ? `${Math.round(framerate)} FPS`
      : undefined
  );
  p.set(
    t('mediaInfoGenericBitrate'),
    isNumber(props.stream.BitRate) && props.stream.BitRate > 0
      ? formatBitRate(props.stream.BitRate)
      : undefined
  );
  p.set(
    t('mediaInfoVideoBitDepth'),
    isNumber(props.stream.BitDepth) && props.stream.BitDepth > 0
      ? `${props.stream.BitDepth} bits`
      : undefined
  );
  p.set(t('mediaInfoVideoRange'), props.stream.VideoRange);
  p.set(t('mediaInfoVideoRangeType'), props.stream.VideoRangeType);
  p.set(t('mediaInfoVideoDoViTitle'), props.stream.VideoDoViTitle);
  p.set(t('mediaInfoVideoDoViMajorVersion'), props.stream.DvVersionMajor);
  p.set(t('mediaInfoVideoDoViMinorVersion'), props.stream.DvVersionMinor);
  p.set(t('mediaInfoVideoDoViProfile'), props.stream.DvProfile);
  p.set(t('mediaInfoVideoDoViLevel'), props.stream.DvLevel);
  p.set(t('mediaInfoVideoDoViRpuPresent'), props.stream.RpuPresentFlag);
  p.set(t('mediaInfoVideoDoViElPresent'), props.stream.ElPresentFlag);
  p.set(t('mediaInfoVideoDoViBlPresent'), props.stream.BlPresentFlag);
  p.set(
    t('mediaInfoVideoDoViBlSignalCompatId'),
    props.stream.DvBlSignalCompatibilityId
  );
  p.set(t('mediaInfoVideoColorSpace'), props.stream.ColorSpace);
  p.set(t('mediaInfoVideoColorTransfer'), props.stream.ColorTransfer);
  p.set(t('mediaInfoVideoColorPrimaries'), props.stream.ColorPrimaries);
  p.set(t('mediaInfoVideoColorRange'), props.stream.ColorRange);
  p.set(t('mediaInfoVideoPixelFormat'), props.stream.PixelFormat);
  p.set(t('mediaInfoVideoRefFrames'), props.stream.RefFrames);
  /**
   * TODO: What is this?
   */
  p.set('NAL', props.stream.NalLengthSize);
  p.set(t('mediaInfoGenericIsDefault'), props.stream.IsDefault ?? false);
  p.set(t('mediaInfoGenericIsForced'), props.stream.IsForced ?? false);
  p.set(t('mediaInfoGenericIsExternal'), props.stream.IsExternal ?? false);
  p.set(t('mediaInfoVideoTimestamp'), props.videoTimestamp);

  return p.entries();
});
</script>
