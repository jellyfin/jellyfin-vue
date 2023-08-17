<template>
  <VDialog
    content-class="metadata-dialog"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <MetadataEditor
      :item-id="itemId"
      :media-source-index="mediaSourceIndex"
      @cancel="model = false"
      @save="model = false" />
  </VDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ itemId: string, mediaSourceIndex?: number }>();

const emit = defineEmits<{
  close: [];
}>();

const model = ref(true);

</script>

<style lang="scss" scoped>
.metadata-dialog {
  height: 60vh;
}
</style>
