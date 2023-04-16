<template>
  <v-dialog
    content-class="media-detail-dialog"
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="close">
    <media-detail
      :item-id="itemId"
      :media-source-index="mediaSourceIndex"
      @hide="close" />
  </v-dialog>
</template>

<script setup lang="ts">
defineProps<{ dialog: boolean; itemId: string; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  (e: 'update:dialog', isOpen: boolean): void;
}>();

/**
 * Close the dialog
 */
function close(): void {
  emit('update:dialog', false);
}
</script>

<style lang="scss" scoped>
.media-detail-dialog {
  height: 60vh;
}
</style>
