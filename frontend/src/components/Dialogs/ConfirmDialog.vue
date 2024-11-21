<template>
  <VDialog
    v-model="model"
    width="auto"
    :fullscreen="$vuetify.display.mobile">
    <VCard>
      <VCardTitle
        v-if="state.title"
        class="text-center">
        {{ state.title }}
      </VCardTitle>
      <VCardSubtitle
        v-if="state.subtitle"
        class="text-center">
        {{ state.subtitle }}
      </VCardSubtitle>

      <VDivider />
      <VCardText
        class="text-center d-flex align-center justify-center">
        <JSafeHtml :html="state.text" />
      </VCardText>
      <VCardActions class="align-center justify-center">
        <VBtn
          variant="elevated"
          color="secondary"
          width="8em"
          @click="cancel">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          width="8em"
          variant="elevated"
          :color="state.confirmColor ?? 'error'"
          @click="confirm">
          {{ state.confirmText ?? t('accept') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts">
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog as vUseConfirmDialog } from '@vueuse/core';

interface ConfirmDialogState {
  title: string;
  text: string;
  confirmText?: string;
  subtitle?: string;
  confirmColor?: string;
}

const state = reactive<ConfirmDialogState>({
  title: '',
  text: '',
  confirmText: undefined,
  subtitle: undefined,
  confirmColor: undefined
});

const { isRevealed, reveal, confirm, cancel } = vUseConfirmDialog();
const model = computed({
  get() {
    return isRevealed.value;
  },
  set(newVal) {
    if (!newVal) {
      cancel();
    }
  }
});

/**
 * Composable for invoking confirm dialog
 * @param func - Function to run if the action is confirmed
 * @param [params] - Set the state of the component for the function invocation
 * @param [params.title] - Dialog title (rendered as VCardTitle)
 * @param [params.subtitle] - Dialog subtitle (rendered as VCardSubtitle)
 * @param [params.text] - Dialog's body
 * @param [params.confirmText] - Confirm's button text
 * @param [params.confirmColor] - Vuetify's color for the confirm button
 * @param raiseError - If you want the cancel action to trigger a promise reject
 */
export async function useConfirmDialog<T>(
  func: () => T | Promise<T>,
  params: ConfirmDialogState,
  raiseError = false
): Promise<T | undefined> {
  state.title = params.title;
  state.text = params.text;
  state.subtitle = params.subtitle;
  state.confirmText = params.confirmText;
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
const { t } = useI18n();
</script>
