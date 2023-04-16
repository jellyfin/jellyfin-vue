<template>
  <media-detail-attr
    v-if="stream.DisplayTitle"
    :label="t('mediaInfoFileTitle')"
    :value="stream.DisplayTitle" />
  <media-detail-attr
    v-if="stream.Language"
    :label="t('mediaInfoGenericLanguage')"
    :value="stream.Language" />
  <media-detail-attr
    v-if="stream.Codec"
    :label="t('mediaInfoGenericCodec')"
    :value="stream.Codec.toUpperCase()" />
  <media-detail-attr
    v-if="stream.CodecTag"
    :label="t('mediaInfoGenericCodecTag')"
    :value="stream.CodecTag" />
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();
</script>
