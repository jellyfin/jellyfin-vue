<template>
  <VDialog
    max-width="60%"
    :model-value="isImageDialogVisible"
    @update:model-value="emit('close')">
    <VCard class="px-6">
      <VCardTitle>{{ t('editPerson') }}</VCardTitle>
      <VDivider class="uno-mb-6" />
      <VCardText class="pa-3">
        <VRow>
          <JFileUpload v-model="file" />
        </VRow>
        <VRow
          v-if="file">
          <VSelect
            v-model="imageType"
            variant="outlined"
            class="uno-mt-6"
            :label="$t('preferredLanguage')"
            item-title="text"
            :items="imageTypes" />
        </VRow>
      </VCardText>

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
import { computed, ref } from 'vue';
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

const file = ref<File | undefined>(undefined);
const imageType = ref<string | undefined>(undefined);
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
async function onSubmit(): Promise<void> {
  const axios = remote.sdk.api?.axiosInstance;
  const serverAddress = remote.sdk.api?.basePath;
  const accessToken = remote.sdk.api?.accessToken;

  if (!accessToken || !axios || !serverAddress || !file.value) {
    useSnackbar('Error', 'red');
    emit('close');

    return;
  }

  const path = `${serverAddress}/Items/${itemId}/Images/${imageType.value}`;
  const base64 = await fileToBase64(file.value);

  await axios.post(path, base64, {
    headers: {
      'Content-Type': file.value.type,
      'Authorization': `MediaBrowser Client="Jellyfin Web (Vue)", Device="Chrome", DeviceId="116db439-0724-4224-bf76-0bae81671cb2", Version="0.3.1", Token="${accessToken}"`
    }
  });

  emit('upload-image');
}

/**
 * Handles the file upload.
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const result = reader.result as string;

      resolve(result.split(',')[1]);
    });

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
</script>
