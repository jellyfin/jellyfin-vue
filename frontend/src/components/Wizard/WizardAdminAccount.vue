<template>
  <VForm v-model="valid">
    <VTextField
      v-model="admin.Name"
      variant="outlined"
      :label="t('username')"
      type="username"
      :rules="RequiredRule"
      :disabled="loading" />
    <VTextField
      v-model="admin.Password"
      variant="outlined"
      :label="t('password')"
      :type="showPassword ? 'text' : 'password'"
      :disabled="loading"
      @click:append="() => (showPassword = !showPassword)">
      <template #append>
        <JIcon
          :class="showPassword ? 'i-mdi:eye-off' : 'i-mdi:eye'"
          class="uno-w-10" />
      </template>
    </VTextField>

    <VTextField
      v-model="passwordCheck"
      variant="outlined"
      :label="t('confirmPassword')"
      :type="showPassword ? 'text' : 'password'"
      :rules="SamePasswordRules"
      :disabled="loading"
      @click:append="() => (showPassword = !showPassword)">
      <template #append>
        <JIcon
          :class="showPassword ? 'i-mdi:eye-off' : 'i-mdi:eye'"
          class="uno-w-10" />
      </template>
    </VTextField>

    <VBtn
      color="secondary"
      variant="elevated"
      :disabled="loading"
      @click="emit('previous-step')">
      {{ t('previous') }}
    </VBtn>
    <VBtn
      color="primary"
      variant="elevated"
      :disabled="!valid || loading"
      :loading="loading"
      @click="createAdminAccount">
      {{ t('next') }}
    </VBtn>
  </VForm>
</template>

<script setup lang="ts">
import type { StartupUserDto } from '@jellyfin/sdk/lib/generated-client';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';

const emit = defineEmits<{
  'previous-step': [];
  'step-complete': [];
}>();

const { t } = useI18n();

const valid = ref(false);
const admin = ref<StartupUserDto>({
  Name: '',
  Password: ''
});
const passwordCheck = ref('');
const showPassword = ref(false);
const loading = ref(false);

const SamePasswordRules = [
  (v: string): boolean | string =>
    v === admin.value.Password || t('bothPasswordsSame')
];
const RequiredRule = [
  (v: string): boolean | string => !!v.trim() || t('required')
];

/**
 * Creates the admin account during the wizard process
 */
async function createAdminAccount(): Promise<void> {
  loading.value = true;

  const api = remote.sdk.api;

  if (!api) {
    return;
  }

  try {
    await getStartupApi(api).updateStartupUser({
      startupUserDto: admin.value
    });

    emit('step-complete');
  } catch (error) {
    console.error(error);
    useSnackbar(t('setAdminError'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
