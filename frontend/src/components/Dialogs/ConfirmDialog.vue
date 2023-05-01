<template>
  <v-dialog v-model="model" width="auto" :fullscreen="$vuetify.display.mobile">
    <v-card>
      <v-card-title v-if="state.title" class="text-center">
        {{ state.title }}
      </v-card-title>
      <v-card-subtitle v-if="state.subtitle" class="text-center">
        {{ state.subtitle }}
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="d-flex text-center align-center justify-center">
        {{ state.text }}
      </v-card-text>
      <v-card-actions class="align-center justify-center">
        <v-btn variant="elevated" color="secondary" width="8em" @click="cancel">
          {{ t('cancel') }}
        </v-btn>
        <v-btn
          width="8em"
          variant="elevated"
          :color="state.confirmColor ?? 'error'"
          @click="confirm">
          {{ state.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { reactive, computed } from 'vue';
import { useConfirmDialog as vUseConfirmDialog } from '@vueuse/core';

interface ConfirmDialogState {
  title: string;
  text: string;
  confirmText: string;
  subtitle?: string;
  confirmColor?: string;
}

const state = reactive<ConfirmDialogState>({
  title: '',
  text: '',
  confirmText: '',
  subtitle: undefined,
  confirmColor: undefined
});

const { isRevealed, reveal, confirm, cancel } = vUseConfirmDialog();
const model = computed({
  get() {
    return isRevealed.value;
  },
  set(newVal) {
    if (newVal === false) {
      cancel();
    }
  }
});

/**
 * Composable for invoking confirm dialog
 * @param func - Function to run if the action is confirmed
 * @param [params] - Set the state of the component for the function invocation
 * @param [params.title] - Dialog title
 * @param [params.subtitle] - Dialog subtitle
 * @param [params.text] - Dialog's body
 * @param [params.confirmText] - Confirm's button text
 * @param [params.confirmColor] - Vuetify's color for the confirm button
 * @param raiseError - If you want the cancel action to trigger a promise reject
 */
export async function useConfirmDialog<T>(
  func: () => T | Promise<T>,
  params: ConfirmDialogState,
  raiseError = false
): Promise<T | void> {
  state.title = params.title || '';
  state.subtitle = params.subtitle;
  state.text = params.text || '';
  state.confirmText = params.confirmText || '';
  state.confirmColor = params.confirmColor;

  const { isCanceled } = await reveal();

  if (isCanceled) {
    if (raiseError) {
      throw new EvalError('Cancelled action by the user');
    }
  } else {
    return await func();
  }
}
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
