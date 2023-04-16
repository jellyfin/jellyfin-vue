<template>
  <media-detail-attr
    v-if="stream.ColorSpace"
    :label="t('mediaInfoVideoColorSpace')"
    :value="stream.ColorSpace" />
  <media-detail-attr
    v-if="stream.ColorTransfer"
    :label="t('mediaInfoVideoColorTransfer')"
    :value="stream.ColorTransfer" />
  <media-detail-attr
    v-if="stream.ColorPrimaries"
    :label="t('mediaInfoVideoColorPrimaries')"
    :value="stream.ColorPrimaries" />
  <media-detail-attr
    v-if="stream.ColorRange"
    :label="t('mediaInfoVideoColorRange')"
    :value="stream.ColorRange" />
  <media-detail-attr
    v-if="stream.PixelFormat"
    :label="t('mediaInfoVideoPixelFormat')"
    :value="stream.PixelFormat" />
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();
</script>
