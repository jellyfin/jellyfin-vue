<template>
  <v-form v-model="valid">
    <v-text-field
      v-model="admin.Name"
      variant="outlined"
      :label="$t('username')"
      type="username"
      :rules="RequiredRule"
      required />
    <v-text-field
      v-model="admin.Password"
      variant="outlined"
      :label="$t('password')"
      :append-icon="showPassword ? IconEyeOff : IconEye"
      :type="showPassword ? 'text' : 'password'"
      @click:append="() => (showPassword = !showPassword)" />

    <v-text-field
      v-model="passwordCheck"
      variant="outlined"
      :label="$t('wizard.confirmPassword')"
      :append-icon="showPassword ? IconEyeOff : IconEye"
      :type="showPassword ? 'text' : 'password'"
      :rules="SamePasswordRules"
      @click:append="() => (showPassword = !showPassword)" />

    <v-btn color="secondary" @click="$emit('previous-step', { step: 2 })">
      {{ $t('previous') }}
    </v-btn>
    <v-btn
      color="primary"
      :disabled="!valid"
      :loading="loading"
      @click="createAdminAccount">
      {{ $t('next') }}
    </v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRemote, useSnackbar } from '@/composables';
import IconEyeOff from '~icons/mdi/eye-off';
import IconEye from '~icons/mdi/eye';

interface StepEvent {
  step: number;
}

const { t } = useI18n();
const api = useRemote().sdk.api;

const emit = defineEmits<{
  (e: 'previous-step', value: StepEvent): void;
  (e: 'step-complete', value: StepEvent): void;
}>();

const valid = ref(false);
const admin = ref({
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

  if (api) {
    try {
      await getStartupApi(api).updateStartupUser({
        startupUserDto: admin.value
      });

      emit('step-complete', { step: 2 });
    } catch (error) {
      console.error(error);
      useSnackbar(t('wizard.setAdminError'), 'error');
    }
  }

  loading.value = false;
}
</script>
