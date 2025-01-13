<template>
  <VDialog
    :model-value="addingNewKey"
    :width="width"
    @update:model-value="emit('close')">
    <VCol class="pa-0 add-key-dialog">
      <VCard>
        <VCardTitle>{{ t('addApiKey') }}</VCardTitle>
        <VCardActions>
          <VForm
            class="add-key-form"
            @submit.prevent="addApiKey">
            <VTextField
              v-model="newKeyAppName"
              variant="outlined"
              :label="t('appName')" />
            <VBtn
              color="primary"
              :loading="loading"
              :disabled="newKeyAppName === ''"
              @click="addApiKey">
              {{ $t('confirm') }}
            </VBtn>
            <VBtn @click="emit('close')">
              {{ $t('cancel') }}
            </VBtn>
          </VForm>
        </VCardActions>
      </VCard>
    </VCol>
  </VDialog>
</template>

<script setup lang="ts">
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';

const { addingNewKey } = defineProps<{ addingNewKey: boolean }>();

const emit = defineEmits<{
  keyAdded: [];
  close: [];
}>();

const { t } = useI18n();
const display = useDisplay();

const newKeyAppName = ref('');
const loading = ref(false);

const width = computed(() => {
  switch (display.name.value) {
    case 'xs': {
      return '100%';
    }
    case 'sm': {
      return 400;
    }
    case 'md': {
      return 500;
    }
    default: {
      return 600;
    }
  }
});

/** Adds a new api key */
async function addApiKey(): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getApiKeyApi).createKey({
      app: newKeyAppName.value
    });

    useSnackbar(t('createKeySuccess'), 'success');

    newKeyAppName.value = '';
    emit('keyAdded');
    emit('close');
  } catch (error) {
    console.error(error);
    useSnackbar(t('createKeyFailure'), 'error');
  }

  loading.value = false;
}
</script>

<style scoped>
.add-key-form {
  width: 100%;
}
</style>
