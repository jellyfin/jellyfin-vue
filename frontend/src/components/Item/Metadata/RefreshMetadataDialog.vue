<template>
  <v-dialog
    content-class="refresh-dialog"
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="close">
    <refresh-metadata
      :item-id="itemId"
      @cancel="close"
      @refresh="saveAndEmit" />
  </v-dialog>
</template>

<script setup lang="ts">
defineProps<{
  dialog: boolean;
  itemId: string;
}>();

const emit = defineEmits<{
  (e: 'update:dialog', isOpen: boolean): void;
  (e: 'on-refresh'): void;
}>();

/**
 * Close the dialog
 */
function close(): void {
  emit('update:dialog', false);
}

/**
 * Save and close the dialog
 */
function saveAndEmit(): void {
  close();
  emit('on-refresh');
}
</script>

<style lang="scss" scoped>
.refresh-dialog {
  height: 60vh;
}
</style>
