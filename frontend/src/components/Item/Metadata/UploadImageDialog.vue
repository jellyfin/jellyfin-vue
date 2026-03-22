<template>
  <VDialog
    class="uno-max-w-[800px] uno-w-full"
    :model-value="isImageDialogVisible"
    @update:model-value="closeDialog">
    <VCard class="uno-px-6">
      <VCardTitle>{{ t('addImage') }}</VCardTitle>
      <VDivider class="uno-mb-6" />
      <VCardText class="uno-pa-3">
        <VRow>
          <JFileUpload
            ref="fileUploadRef"
            v-model="selectedFile"
            accept="image/*" />
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
        class="uno-mt-2 uno-flex uno-items-center uno-pa-3"
        :class="{
          'uno-justify-end': !$vuetify.display.mobile,
          'uno-justify-center': $vuetify.display.mobile
        }">
        <VSpacer />
        <VBtn
          variant="flat"
          class="uno-mr-1"
          @click="closeDialog">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          :disabled="!selectedFile || !imageType"
          variant="flat"
          color="primary"
          class="uno-min-w-[8em]"
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
import type { JFileUploadExpose } from '@jellyfin-vue/ui-toolkit/components';
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
const fileUploadRef = ref<JFileUploadExpose | undefined>(undefined);
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
 * Handle dialog closing.
 */
function closeDialog(): void {
  selectedFile.value = undefined;
  imageType.value = undefined;
  emit('close');
}

/**
 * Handle the file upload.
 */
async function onSave(): Promise<void> {
  if (!selectedFile.value || !imageType.value) {
    useSnackbar(t('failedToReadImage'), 'red');

    return;
  }

  // According to the TypeScript typings, the SDK expects the body to be a File.
  // However, sending a File causes the backend to return a 500 error due to a base64 parsing exception.
  // When the File is converted to a base64 string, the backend works as expected.
  const base64FileContent = await fileUploadRef.value?.readSelectedFileAsBase64();

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
    useSnackbar(t('imageUploadedSuccessfully'), 'green');
  } catch {
    useSnackbar(t('imageUploadFailed'), 'red');
  }
}
</script>
