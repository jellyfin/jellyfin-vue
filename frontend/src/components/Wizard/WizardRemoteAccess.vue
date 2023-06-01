<template>
  <div>
    <v-checkbox
      v-model="allowRemoteAccess"
      :label="t('wizard.allowRemoteAccess')"
      :disabled="loading" />
    <v-checkbox v-model="enableUPNP" :label="t('enableUPNP')" />
    <v-btn
      color="secondary"
      variant="elevated"
      :disabled="loading"
      @click="emit('previous-step')">
      {{ t('previous') }}
    </v-btn>
    <v-btn
      :loading="loading"
      color="primary"
      variant="elevated"
      @click="setRemoteAccess">
      {{ t('finish') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { useRemote, useSnackbar } from '@/composables';

const emit = defineEmits<{
  'step-complete': [];
  'previous-step': [];
}>();

const { t } = useI18n();
const remote = useRemote();

const allowRemoteAccess = ref(false);
const enableUPNP = ref(false);
const loading = ref(false);

/**
 * Update settings and continue to next step
 */
async function setRemoteAccess(): Promise<void> {
  loading.value = true;

  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer?.PublicAddress ?? ''
  );

  try {
    await getStartupApi(api).setRemoteAccess({
      startupRemoteAccessDto: {
        EnableRemoteAccess: allowRemoteAccess.value,
        EnableAutomaticPortMapping: enableUPNP.value
      }
    });

    emit('step-complete');
  } catch (error) {
    console.error(error);
    useSnackbar(t('wizard.setRemoteError'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
