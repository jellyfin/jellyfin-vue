<template>
  <v-btn variant="flat" width="1em" color="secondary" @click="copyToClipboard">
    <v-icon><i-mdi-content-copy /></v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables';

const props = defineProps<{
  text: string;
}>();

const { t } = useI18n();

/**
 * Copy to clipboard action.
 */
async function copyToClipboard(): Promise<void> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(props.text);
      useSnackbar(t('clipboardSuccess'), 'success');
    } catch {
      useSnackbar(t('clipboardFail'), 'error');
    }
  } else {
    useSnackbar(t('clipboardUnavailable'), 'error');
  }
}
</script>
