<template>
  <VDialog
    max-width="60%"
    :model-value="isImageDialogVisible"
    @update:model-value="emit('close')">
    <VCard class="px-6">
      <VCardTitle>{{ t('addImage') }}</VCardTitle>
      <VDivider class="uno-mb-6" />
      <VCardText class="pa-3">
        <VRow>
          <JFileUpload v-model="selectedFile" />
        </VRow>
        <VRow
          v-if="selectedFile">
          <VSelect
            v-model="imageType"
            variant="outlined"
            class="uno-mt-6"
            :label="$t('imageType')"
            item-title="text"
            :items="imageTypes" />
        </VRow>
      </VCardText>
      <VDivider class="uno-mt-6" />
      <VCardActions
        class="d-flex align-center pa-3 uno-mt-2"
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
          :disabled="!selectedFile || !imageType"
          variant="flat"
          width="8em"
          color="primary"
          @click="onSave">
          {{ t('save') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import type { ImageApiSetItemImageRequest } from '@jellyfin/sdk/lib/generated-client/api/image-api';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { computed, ref } from 'vue';
import type { AxiosRequestConfig } from 'axios';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';

const { isImageDialogVisible, itemId } = defineProps<{
  isImageDialogVisible: boolean;
  itemId: string;
}>();

const emit = defineEmits<{
  'close': [];
  'upload-image': [];
}>();

const { t } = useTranslation();

const selectedFile = ref<File | undefined>(undefined);
const imageType = ref<ImageType | undefined>(undefined);
const imageTypes = computed(() => [
  { text: t('primary'), value: 'Primary' },
  { text: t('banner'), value: 'Banner' },
  { text: t('box'), value: 'Box' },
  { text: t('boxRear'), value: 'BoxRear' },
  { text: t('backdrop'), value: 'Backdrop' },
  { text: t('disc'), value: 'Disc' },
  { text: t('logo'), value: 'Logo' },
  { text: t('menu'), value: 'Menu' },
  { text: t('thumb'), value: 'Thumb' }
]);

/**
 * Handles the file upload.
 */
async function onSave(): Promise<void> {
  if (!selectedFile.value || !imageType.value) {
    useSnackbar(t('failedToReadImage'), 'red');
    emit('close');

    return;
  }

  const base64FileContent = await ReadFileContent(selectedFile.value);

  const payload: ImageApiSetItemImageRequest = {
    itemId,
    imageType: imageType.value,
    body: base64FileContent as unknown as File
  };

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': selectedFile.value.type
    }
  };

  try {
    await remote.sdk.newUserApi(getImageApi).setItemImage(payload, config);

    selectedFile.value = undefined;
    imageType.value = undefined;

    emit('upload-image');
    useSnackbar(t('imageUploadedSuccesfully'), 'green');
  } catch {
    useSnackbar(t('imageUploadFailed'), 'red');
  }
}

/**
 * Reads the file content in base64 format.
 */
async function ReadFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const result = reader.result as string;

      const base64FileContent = result.split(',')[1];

      if (!base64FileContent) {
        reject(new Error('Failed to read file content'));

        return;
      }

      resolve(base64FileContent);
    });

    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('File reading failed'));
    });

    reader.readAsDataURL(file);
  });
}
</script>
