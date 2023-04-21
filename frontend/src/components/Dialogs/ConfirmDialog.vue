<template>
  <v-dialog
    class="confirm-dialog"
    content-class="confirm-dialog"
    :model-value="isRevealed"
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="cancel">
    <v-card
      height="100%"
      class="d-flex width-90"
      :title="state.title"
      :subtitle="state.subtitle">
      <v-divider />

      <v-card-text class="text-center font-weight-normal px-4">
        {{ state.text }}
      </v-card-text>

      <v-divider />

      <v-card-actions class="d-flex flex-row align-center justify-center mb-4">
        <v-btn variant="flat" width="8em" color="secondary" @click="cancel">
          {{ t('cancel') }}
        </v-btn>

        <v-btn
          variant="flat"
          width="8em"
          :color="state.confirmColor ?? 'error'"
          @click="confirm">
          {{ state.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { reactive } from 'vue';
import { useConfirmDialog as vUseConfirmDialog } from '@vueuse/core';

interface ConfirmDialogState {
  title: string;
  text: string;
  confirmText: string;
  subtitle?: string;
  confirmColor?: string;
  callback?: () => Promise<void>;
}

let state: ConfirmDialogState = reactive({
  title: '',
  text: '',
  confirmText: '',
  subtitle: '',
  confirmColor: ''
});

const { isRevealed, reveal, confirm, cancel } = vUseConfirmDialog();

const openDialog = async (): Promise<void> => {
  const { isCanceled } = await reveal();

  if (!isCanceled && state.callback) {
    await state.callback();
  }
};

interface UseConfirmDialogReturn {
  openDialog: () => Promise<void>;
  onConfirm: (cb: () => Promise<void>) => void;
}

/**
 * Composable for invoking confirm dialog
 */
export function useConfirmDialog(
  params: Omit<ConfirmDialogState, 'callback'>
): UseConfirmDialogReturn {
  state.title = params.title || '';
  state.text = params.text || '';
  state.confirmText = params.confirmText || '';
  state.subtitle = params.subtitle;
  state.confirmColor = params.confirmColor;

  return {
    openDialog,
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    onConfirm: (cb: () => Promise<void>) => (state.callback = cb)
  };
}
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.confirm-dialog {
  max-width: 100vw;
}

@media screen and (min-width: 600px) {
  .confirm-dialog {
    max-width: 70vw;
  }
}
</style>
