<template>
  <VDialog
    content-class="metadata-dialog"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <MetadataEditor
      :item-id="itemId"
      @cancel="model = false"
      @save="model = false" />
  </VDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const { itemId } = defineProps<{ itemId: string }>();

const emit = defineEmits<{
  close: [];
}>();

const model = ref(true);

</script>

<style scoped>
.metadata-dialog {
  height: 60vh;
}
</style>
