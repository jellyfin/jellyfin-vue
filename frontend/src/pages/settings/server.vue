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
import { shallowRef, watch } from 'vue';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { useApi } from '#/composables/apis';
import { taskManager } from '#/store/task-manager.ts';

let taskId: string | undefined;

const signal = shallowRef(false);
const [
  { data: culturesList },
  { data: serverSettings },
  { data: brandingSettings }
] = await Promise.all([
  useApi(getLocalizationApi, 'getLocalizationOptions')(),
  useApi(getConfigurationApi, 'getConfiguration')(),
  useApi(getBrandingApi, 'getBrandingOptions')()
]);

const { loading: l1 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  serverConfiguration: serverSettings.value
}));
const { loading: l2 } = await useApi(
  getConfigurationApi,
  () => signal.value ? 'updateNamedConfiguration' : undefined,
  { skipCache: { request: true }, globalLoading: false }
)(() => ({
  key: 'branding',
  body: JSON.stringify(brandingSettings.value)
}));

watch([l1, l2], (newval) => {
  if (newval.some(Boolean)) {
    taskId = taskManager.startConfigSync();
  } else if (taskId) {
    taskManager.finishTask(taskId);
  }
});

watch([serverSettings, brandingSettings], () => signal.value = true, { once: true });
</script>
