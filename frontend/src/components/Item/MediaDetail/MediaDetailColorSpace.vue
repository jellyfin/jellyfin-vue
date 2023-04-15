<template>
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
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();
</script>
