<template>
  <SettingsPage>
    <template #title>
      {{ $t('serverSettings') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsGeneral') }}
        </h3>

        <VTextField
          v-model="serverSettings.ServerName"
          :label="$t('serverName')" />

        <VSelect
          v-model="serverSettings.UICulture"
          :loading="loading"
          :disabled="loading"
          variant="outlined"
          :label="$t('preferredLanguage')"
          :rules="SomeItemSelectedRule"
          item-title="Name"
          item-value="Value"
          :items="culturesList" />

        <VCheckbox
          v-model="serverSettings.QuickConnectAvailable"
          :label="$t('enableQuickConnect')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPaths') }}
        </h3>

        <VTextField
          v-model="serverSettings.CachePath"
          :label="$t('cachePath')" />

        <VTextField
          v-model="serverSettings.MetadataPath"
          :label="$t('metadataPath')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsBranding') }}
        </h3>

        <VTextField
          v-model="brandingSettings.LoginDisclaimer"
          :label="$t('loginDisclaimer')" />

        <VCheckbox
          v-model="brandingSettings.SplashscreenEnabled"
          :label="$t('enableSplashScreen')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPerformance') }}
        </h3>

        <VTextField
          v-model.number="serverSettings.LibraryScanFanoutConcurrency"
          :label="$t('parallelLibraryScanLimit')"
          type="number" />

        <VTextField
          v-model.number="serverSettings.ParallelImageEncodingLimit"
          :label="$t('parallelImageEncodingLimit')"
          type="number" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import type { LocalizationOption } from '@jellyfin/sdk/lib/generated-client';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';
import type { BrandingOptions } from '@jellyfin/sdk/lib/generated-client/models/branding-options';
import i18next from 'i18next';
import { useApi } from '#/composables/apis';
import { taskManager } from '#/store/task-manager.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';

const serverSettings = ref<Partial<ServerConfiguration>>({
  ServerName: '',
  UICulture: '',
  QuickConnectAvailable: false,
  CachePath: '',
  MetadataPath: '',
  LibraryScanFanoutConcurrency: 0,
  ParallelImageEncodingLimit: 0
});
const brandingSettings = ref<Partial<BrandingOptions>>({
  LoginDisclaimer: '',
  SplashscreenEnabled: false
});

const loading = shallowRef(false);
const culturesList = ref<LocalizationOption[]>([]);

const updateConfigurationApiCaller = useApi(
  getConfigurationApi,
  'updateConfiguration',
  { skipCache: { request: true }, globalLoading: false }
);

const updateNamedConfigurationApiCaller = useApi(
  getConfigurationApi,
  'updateNamedConfiguration',
  { skipCache: { request: true }, globalLoading: false }
);

/**
 * Loads the settings from the server
 */
async function loadSettings() {
  loading.value = true;

  try {
    const { data: localization } = await useApi(getLocalizationApi, 'getLocalizationOptions')();
    const { data: config } = await useApi(getConfigurationApi, 'getConfiguration')();
    const { data: branding } = await useApi(getBrandingApi, 'getBrandingOptions')();

    serverSettings.value = config.value!;
    brandingSettings.value = branding.value;
    culturesList.value = localization.value;
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    loading.value = false;
  }
}

await loadSettings();

watch(serverSettings, async () => {
  const syncTaskId = taskManager.startConfigSync();

  try {
    await updateConfigurationApiCaller(() => ({
      serverConfiguration: serverSettings.value
    }));
  } catch {
    useSnackbar(i18next.t('failedSyncingUserSettings'), 'error');
  } finally {
    taskManager.finishTask(syncTaskId);
  }
}, { deep: true });

watch(brandingSettings, async () => {
  const syncTaskId = taskManager.startConfigSync();

  try {
    await updateNamedConfigurationApiCaller(() => ({
      key: 'branding',
      body: JSON.stringify(brandingSettings.value)
    }));
  } catch {
    useSnackbar(i18next.t('failedSyncingUserSettings'), 'error');
  } finally {
    taskManager.finishTask(syncTaskId);
  }
}, { deep: true });
</script>
