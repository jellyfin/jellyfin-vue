<template>
  <v-dialog
    content-class="identify-dialog"
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="close">
    <identify-tab :item-id="itemId" @close="close" />
  </v-dialog>
</template>

<script setup lang="ts">
defineProps<{ dialog: boolean; itemId: string }>();

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
.identify-dialog {
  height: 60vh;
}
</style>
