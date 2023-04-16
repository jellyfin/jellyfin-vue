<template>
  <media-detail-attr
    :label="t('mediaInfoGenericIsDefault')"
    :value="formatYesOrNo(stream.IsDefault)" />
  <media-detail-attr
    :label="t('mediaInfoGenericIsForced')"
    :value="formatYesOrNo(stream.IsForced)" />
  <media-detail-attr
    :label="t('mediaInfoGenericIsExternal')"
    :value="formatYesOrNo(stream.IsExternal)" />
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { formatYesOrNo } from '@/utils/mediainfo';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();
</script>
