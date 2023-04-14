<template>
  <v-btn variant="flat" width="1em" color="secondary" @click="copy">
    <v-icon><i-mdi-content-copy /></v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables';
import { writeToClipboard } from '@/utils/clipboard';

const props = defineProps<{
  text: string;
}>();

const { t } = useI18n();

const copy = async (): Promise<void> => {
  try {
    await writeToClipboard(props.text);
    useSnackbar(t('clipboardSuccess'), 'success');
  } catch {
    useSnackbar(t('clipboardFail'), 'error');
  }
};
</script>
