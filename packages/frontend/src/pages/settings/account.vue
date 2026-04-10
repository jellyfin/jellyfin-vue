<template>
  <SettingsPage>
    <template #title>
      {{ t('account') }}
    </template>
    <template #content>
      <VCol
        cols="12"
        md="10"
        lg="6">
        <div class="uno-mb-10 uno-flex uno-flex-col sm:uno-flex-row">
          <UserImage :size="190" />
          <div class="sm:uno-ml-10">
            <div class="uno-mb-7 uno-ml-2 uno-mt-6 uno-text-4xl sm:uno-mt-0">
              {{ remote.auth.currentUser.value?.Name }}
            </div>
            <div class="uno-flex uno-flex-col sm:uno-flex-row">
              <JFileUpload
                ref="fileUploadRef"
                v-model="selectedUserPicture"
                :loading="isChangeImageLoading"
                type="button"
                block
                :button-text="t('changeImage')"
                accept="image/*" />
              <VBtn
                :loading="isDeleteImageLoading"
                variant="flat"
                size="large"
                class="uno-ml-0 uno-mt-6 sm:uno-ml-4 sm:uno-mt-0"
                color="error"
                @click="deleteUserImage">
                {{ t('deleteImage') }}
              </VBtn>
            </div>
          </div>
        </div>
        <div>
          <VTextField
            v-model="currentPassword"
            variant="outlined"
            class="uno-mb-2"
            :label="$t('currentPassword')"
            type="password" />
          <VTextField
            v-model="newPassword"
            variant="outlined"
            class="uno-mb-2"
            :label="$t('newPassword')"
            type="password" />
          <VTextField
            v-model="repeatNewPassword"
            variant="outlined"
            class="uno-mb-2"
            :label="$t('confirmPassword')"
            type="password" />
          <VBtn
            :loading="isChangePasswordLoading"
            :block="$vuetify.display.mobile"
            variant="flat"
            size="large"
            color="primary"
            @click="changePassword">
            {{ t('changePassword') }}
          </VBtn>
        </div>
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { nextTick, ref, shallowRef, watch } from 'vue';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { UserApiUpdateUserPasswordRequest } from '@jellyfin/sdk/lib/generated-client/api/user-api';
import type { ImageApiPostUserImageRequest } from '@jellyfin/sdk/lib/generated-client/api/image-api';
import type { AxiosRequestConfig } from 'axios';
import { useConfirmDialog } from '../../composables/use-confirm-dialog';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const { t } = useTranslation();

const currentPassword = shallowRef('');
const newPassword = shallowRef('');
const repeatNewPassword = shallowRef('');

const isChangePasswordLoading = shallowRef(false);
const isChangeImageLoading = shallowRef(false);
const isDeleteImageLoading = shallowRef(false);

const fileUploadRef = ref(undefined);
const selectedUserPicture = ref<File | undefined>(undefined);

/**
 * Delete user's profile image
 */
async function deleteUserImage() {
  await useConfirmDialog(async () => {
    isDeleteImageLoading.value = true;

    try {
      await remote.sdk.newUserApi(getImageApi).deleteUserImage();
    } catch {
      useSnackbar(t('failedToDeleteImage'), 'red');
    } finally {
      isDeleteImageLoading.value = false;
    }

    await remote.auth.refreshCurrentUserInfo();
  }, {
    title: t('deleteImage'),
    text: t('deleteImageConfirm'),
    confirmText: t('delete')
  });
}

/**
 * Change user's profile image
 */
async function changeUserImage() {
  if (!selectedUserPicture.value) {
    useSnackbar(t('failedToReadImage'), 'red');

    return;
  }

  // According to the TypeScript typings, the SDK expects the body to be a File.
  // However, sending a File causes the backend to return a 500 error due to a base64 parsing exception.
  // When the File is converted to a base64 string, the backend works as expected.
  const base64FileContent = await fileUploadRef.value?.readSelectedFileAsBase64();

  const payload: ImageApiPostUserImageRequest = {
    userId: remote.auth.currentUserId.value,
    body: base64FileContent as unknown as File
  };

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': selectedUserPicture.value.type
    }
  };

  isChangeImageLoading.value = true;

  try {
    await remote.sdk.newUserApi(getImageApi).postUserImage(payload, config);
  } catch {
    useSnackbar(t('failedToChangeImage'), 'red');
  } finally {
    isChangeImageLoading.value = false;
  }

  selectedUserPicture.value = undefined;

  await remote.auth.refreshCurrentUserInfo();
}

/**
 * Change user's password
 */
async function changePassword() {
  if (newPassword.value !== repeatNewPassword.value) {
    useSnackbar(t('newPasswordAndConfirmNewPasswordMustBeTheSame'), 'red');

    return;
  }

  const payload: UserApiUpdateUserPasswordRequest = {
    updateUserPassword: {
      CurrentPw: currentPassword.value,
      NewPw: newPassword.value
    }
  };

  try {
    isChangePasswordLoading.value = true;
    await remote.sdk.newUserApi(getUserApi).updateUserPassword(payload);

    newPassword.value = '';
    currentPassword.value = '';
    repeatNewPassword.value = '';

    useSnackbar(t('passwordChangedSuccessfully'), 'green');
  } catch {
    useSnackbar(t('passwordChangeFailed'), 'red');
  } finally {
    isChangePasswordLoading.value = false;
  }
}

watch(selectedUserPicture, async (newVal) => {
  if (newVal) {
    await nextTick();
    await changeUserImage();
  }
});

</script>
