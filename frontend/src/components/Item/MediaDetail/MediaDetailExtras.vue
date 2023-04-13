<template>
  <media-detail-attr
    :label="t('mediaInfo.generic.default')"
    :value="yesOrNo(stream.IsDefault)" />
  <media-detail-attr
    :label="t('mediaInfo.generic.forced')"
    :value="yesOrNo(stream.IsForced)" />
  <media-detail-attr
    :label="t('mediaInfo.generic.external')"
    :value="yesOrNo(stream.IsExternal)" />
</template>

<script setup lang="ts">
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

defineProps<{ stream: MediaStream }>();

const { t } = useI18n();

/**
 * Format a boolean value into a Yes/No string.
 */
function yesOrNo(value: boolean | null | undefined): string {
  return value ? 'Yes' : 'No';
}
</script>
