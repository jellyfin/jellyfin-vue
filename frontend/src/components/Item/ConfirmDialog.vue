<template>
  <v-dialog
    class="confirm-dialog"
    content-class="confirm-dialog"
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="close">
    <v-card height="100%" class="d-flex width-90">
      <v-card-title class="text-center font-weight-light mt-4">
        {{ title }}
      </v-card-title>
      <v-card-subtitle v-if="subtitle" class="pb-3 text-center">
        {{ subtitle }}
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="text-center font-weight-normal px-4">
        {{ text }}
      </v-card-text>

      <v-divider />

      <v-card-actions class="d-flex flex-row align-center justify-center mb-4">
        <v-btn variant="flat" width="8em" color="secondary" @click="close">
          {{ t('cancel') }}
        </v-btn>

        <v-btn
          variant="flat"
          width="8em"
          :color="confirmColor ?? 'error'"
          @click="closeAndConfirm">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  dialog: boolean;
  title: string;
  text: string;
  confirmText: string;
  subtitle?: string;
  confirmColor?: string;
}>();

const emit = defineEmits<{
  (e: 'update:dialog', isOpen: boolean): void;
  (e: 'onConfirm'): void;
}>();

const { t } = useI18n();

/**
 * Close the dialog
 */
function close(): void {
  emit('update:dialog', false);
}

/**
 * Close the dialog and send confirmation event
 */
function closeAndConfirm(): void {
  close();
  emit('onConfirm');
}
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
