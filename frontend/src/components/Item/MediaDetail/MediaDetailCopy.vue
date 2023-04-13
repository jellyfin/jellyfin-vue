<template>
  <v-btn variant="flat" width="1em" color="secondary" @click="copyToClipboard">
    <v-icon><i-mdi-content-copy /></v-icon>
  </v-btn>
  <textarea ref="fallback" :value="props.text" class="d-none" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables';
import { getIOSVersion, isApple } from '@/utils/browser-detection';

const props = defineProps<{
  text: string;
}>();

const { t } = useI18n();
const fallback = ref<HTMLTextAreaElement>();

/**
 * A fallback method to copy to clipboard.
 */
function fallbackCopyClipboard(): void {
  // Maybe remove if we decide to drop support for legacy system.
  const textArea = fallback.value;

  if (textArea) {
    // iOS 13.4 supports Clipboard.writeText (https://stackoverflow.com/a/61868028)
    if (isApple() && getIOSVersion() < [13, 4]) {
      const range = document.createRange();

      range.selectNodeContents(textArea);

      const selection = window.getSelection();

      selection?.removeAllRanges();
      selection?.addRange(range);
      textArea.setSelectionRange(0, 999_999);
    } else {
      textArea.select();
    }
  }

  try {
    if (document.execCommand('copy')) {
      useSnackbar(t('clipboardSuccess'), 'success');
    } else {
      useSnackbar(t('clipboardFail'), 'error');
    }
  } catch {
    useSnackbar(t('clipboardFail'), 'error');
  }
}

/**
 * Copy to clipboard.
 */
async function copyToClipboard(): Promise<void> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(props.text);
      useSnackbar(t('clipboardSuccess'), 'success');
    } catch {
      fallbackCopyClipboard();
    }
  } else {
    fallbackCopyClipboard();
  }
}
</script>
