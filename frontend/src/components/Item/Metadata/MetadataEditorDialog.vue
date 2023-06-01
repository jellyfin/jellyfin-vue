<template>
  <v-dialog
    content-class="metadata-dialog"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <metadata-editor
      :item-id="itemId"
      @cancel="model = false"
      @save="model = false" />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ itemId: string }>();

const model = ref(true);

const emit = defineEmits<{
  close: [];
}>();
</script>

<style lang="scss" scoped>
.metadata-dialog {
  height: 60vh;
}
</style>
