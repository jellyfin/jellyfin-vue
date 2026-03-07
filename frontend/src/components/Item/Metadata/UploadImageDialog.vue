<template>
  <VDialog
    max-width="60%"
    :model-value="isImageDialogVisible"
    @update:model-value="emit('close')">
    <VCard>
      <VCardTitle>{{ t('editPerson') }}</VCardTitle>
      <VDivider />
      <VCardText class="pa-3">
        <VRow>
          <JFileUpload v-model="file" />
        </VRow>
      </VCardText>

      <VCardActions
        class="d-flex align-center pa-3"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <VSpacer />
        <VBtn
          variant="flat"
          width="8em"
          class="mr-1"
          @click="emit('close')">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          variant="flat"
          width="8em"
          color="primary"
          @click="onSubmit">
          {{ t('save') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { ref } from 'vue';

const { isImageDialogVisible } = defineProps<{ isImageDialogVisible: boolean }>();

const emit = defineEmits<{
  'update:image': [file: string];
  'close': [];
}>();

const { t } = useTranslation();

const file = ref<File | undefined>(undefined);

/**
 * Handles the file upload.
 */
function onSubmit(): void {
  emit('update:image', '');
}
</script>
