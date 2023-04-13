<template>
  <media-detail-attr
    v-if="stream.DisplayTitle"
    :label="t('mediaInfo.generic.title')"
    :value="stream.DisplayTitle" />
  <media-detail-attr
    v-if="stream.Language"
    :label="t('mediaInfo.generic.language')"
    :value="stream.Language" />
  <media-detail-attr
    v-if="stream.Codec"
    :label="t('mediaInfo.generic.codec')"
    :value="stream.Codec.toUpperCase()" />
  <media-detail-attr
    v-if="stream.CodecTag"
    :label="t('mediaInfo.generic.codecTag')"
    :value="stream.CodecTag" />
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();
</script>
