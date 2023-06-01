<template>
  <v-form v-model="valid">
    <v-text-field
      v-model="admin.Name"
      variant="outlined"
      :label="t('username')"
      type="username"
      :rules="RequiredRule"
      :disabled="loading" />
    <v-text-field
      v-model="admin.Password"
      variant="outlined"
      :label="t('password')"
      :append-icon="showPassword ? IconEyeOff : IconEye"
      :type="showPassword ? 'text' : 'password'"
      :disabled="loading"
      @click:append="() => (showPassword = !showPassword)" />

    <v-text-field
      v-model="passwordCheck"
      variant="outlined"
      :label="t('wizard.confirmPassword')"
      :append-icon="showPassword ? IconEyeOff : IconEye"
      :type="showPassword ? 'text' : 'password'"
      :rules="SamePasswordRules"
      :disabled="loading"
      @click:append="() => (showPassword = !showPassword)" />

    <v-btn
      color="secondary"
      variant="elevated"
      :disabled="loading"
      @click="emit('previous-step')">
      {{ t('previous') }}
    </v-btn>
    <v-btn
      color="primary"
      variant="elevated"
      :disabled="!valid || loading"
      :loading="loading"
      @click="createAdminAccount">
      {{ t('next') }}
    </v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { StartupUserDto } from '@jellyfin/sdk/lib/generated-client';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import IconEyeOff from 'virtual:icons/mdi/eye-off';
import IconEye from 'virtual:icons/mdi/eye';
import { useRemote, useSnackbar } from '@/composables';

const emit = defineEmits<{
  'previous-step': [];
  'step-complete': [];
}>();

const { t } = useI18n();
const remote = useRemote();

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
    v === admin.value.Password || t('validation.bothPasswordsSame')
];
const RequiredRule = [
  (v: string): boolean | string => !!v.trim() || t('validation.required')
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
    useSnackbar(t('wizard.setAdminError'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
