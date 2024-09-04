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
import { isNumber, isBool } from '@/utils/validation';
import { getLocaleName } from '@/utils/i18n';
import { formatBitRate } from '@/utils/items';

const { stream, videoTimestamp } = defineProps<{
  stream: MediaStream;
  videoTimestamp?: TransportStreamTimestamp;
}>();

const { t, locale } = useI18n();

const properties = computed(() => {
  const p = new Map<string, string | number | boolean | null | undefined>();
  const resolution
    = stream.Width && stream.Height
      ? `${stream.Width}x${stream.Height}`
      : undefined;
  const framerate = stream.AverageFrameRate ?? stream.RealFrameRate;
  const language = stream.Language
    ? getLocaleName(stream.Language, locale.value)
    : undefined;

  p.set(t('mediaInfoFileTitle'), stream.DisplayTitle);
  p.set(t('mediaInfoGenericLanguage'), language);
  p.set(t('mediaInfoGenericCodec'), stream.Codec?.toUpperCase());
  p.set(t('mediaInfoGenericCodecTag'), stream.CodecTag);
  p.set(t('mediaInfoGenericProfile'), stream.Profile);
  p.set(t('mediaInfoVideoLevel'), stream.Level);
  p.set(t('mediaInfoVideoResolution'), resolution);
  p.set(t('mediaInfoAspectRatio'), stream.AspectRatio);
  p.set(t('mediaInfoVideoIsAnamorphic'), stream.IsAnamorphic);
  p.set(
    t('mediaInfoVideoScanType'),
    stream.IsInterlaced
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
    isNumber(stream.BitRate) && stream.BitRate > 0
      ? formatBitRate(stream.BitRate)
      : undefined
  );
  p.set(
    t('mediaInfoVideoBitDepth'),
    isNumber(stream.BitDepth) && stream.BitDepth > 0
      ? `${stream.BitDepth} bits`
      : undefined
  );
  p.set(t('mediaInfoVideoRange'), stream.VideoRange);
  p.set(t('mediaInfoVideoRangeType'), stream.VideoRangeType);
  p.set(t('mediaInfoVideoDoViTitle'), stream.VideoDoViTitle);
  p.set(t('mediaInfoVideoDoViMajorVersion'), stream.DvVersionMajor);
  p.set(t('mediaInfoVideoDoViMinorVersion'), stream.DvVersionMinor);
  p.set(t('mediaInfoVideoDoViProfile'), stream.DvProfile);
  p.set(t('mediaInfoVideoDoViLevel'), stream.DvLevel);
  p.set(t('mediaInfoVideoDoViRpuPresent'), stream.RpuPresentFlag);
  p.set(t('mediaInfoVideoDoViElPresent'), stream.ElPresentFlag);
  p.set(t('mediaInfoVideoDoViBlPresent'), stream.BlPresentFlag);
  p.set(
    t('mediaInfoVideoDoViBlSignalCompatId'),
    stream.DvBlSignalCompatibilityId
  );
  p.set(t('mediaInfoVideoColorSpace'), stream.ColorSpace);
  p.set(t('mediaInfoVideoColorTransfer'), stream.ColorTransfer);
  p.set(t('mediaInfoVideoColorPrimaries'), stream.ColorPrimaries);
  p.set(t('mediaInfoVideoColorRange'), stream.ColorRange);
  p.set(t('mediaInfoVideoPixelFormat'), stream.PixelFormat);
  p.set(t('mediaInfoVideoRefFrames'), stream.RefFrames);
  /**
   * TODO: What is this?
   */
  p.set('NAL', stream.NalLengthSize);
  p.set(t('mediaInfoGenericIsDefault'), stream.IsDefault ?? false);
  p.set(t('mediaInfoGenericIsForced'), stream.IsForced ?? false);
  p.set(t('mediaInfoGenericIsExternal'), stream.IsExternal ?? false);
  p.set(t('mediaInfoVideoTimestamp'), videoTimestamp);

  return p.entries();
});
</script>
