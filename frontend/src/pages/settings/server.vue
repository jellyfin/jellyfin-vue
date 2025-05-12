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
          v-model="serverSettings.name"
          :label="$t('serverName')" />

        <VSelect
          v-model="serverSettings.language"
          :loading="loading"
          :disabled="loading"
          variant="outlined"
          :label="$t('preferredLanguage')"
          :rules="SomeItemSelectedRule"
          item-title="Name"
          item-value="Value"
          :items="culturesList" />

        <VCheckbox
          v-model="serverSettings.quickConnect"
          :label="$t('enableQuickConnect')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPaths') }}
        </h3>

        <VTextField
          v-model="serverSettings.cachePath"
          :label="$t('cachePath')" />

        <VTextField
          v-model="serverSettings.metadataPath"
          :label="$t('metadataPath')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsBranding') }}
        </h3>

        <VTextField
          v-model="serverSettings.loginDisclaimer"
          :label="$t('loginDisclaimer')" />

        <VCheckbox
          v-model="serverSettings.enableSplash"
          :label="$t('enableSplashScreen')" />

        <h3 class="uno-mb-2 uno-text-lg uno-font-bold">
          {{ $t('serverSettingsPerformance') }}
        </h3>

        <VTextField
          v-model.number="serverSettings.parallelLibraryScan"
          :label="$t('parallelLibraryScanLimit')"
          type="number" />

        <VTextField
          v-model.number="serverSettings.parallelImageEncoding"
          :label="$t('parallelImageEncodingLimit')"
          type="number" />

        <VBtn
          variant="flat"
          width="8em"
          color="primary"
          :loading="saving"
          :disabled="saving"
          @click="saveSettings">
          {{ $t('save') }}
        </VBtn>
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue';
import type { LocalizationOption } from '@jellyfin/sdk/lib/generated-client';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';

interface ServerSettings {
  name: string | undefined;
  language: string | undefined;
  quickConnect: boolean | undefined;
  cachePath: string | undefined | null;
  metadataPath: string | undefined;
  loginDisclaimer: string | undefined | null;
  enableSplash: boolean | undefined;
  parallelLibraryScan: number | undefined;
  parallelImageEncoding: number | undefined;
}

const serverSettings = ref<ServerSettings>({
  name: '',
  language: '',
  quickConnect: false,
  cachePath: '',
  metadataPath: '',
  loginDisclaimer: '',
  enableSplash: true,
  parallelLibraryScan: 0,
  parallelImageEncoding: 0
});

const loading = shallowRef(false);
const saving = shallowRef(false);
const culturesList = ref<LocalizationOption[]>([]);

/**
 * * Saves the settings to the server
 */
async function saveSettings() {
  saving.value = true;

  try {
    const configApi = remote.sdk.newUserApi(getConfigurationApi);
    const configRes = await configApi.getConfiguration();
    const config = configRes.data;

    config.ServerName = serverSettings.value.name;
    config.UICulture = serverSettings.value.language;
    config.QuickConnectAvailable = serverSettings.value.quickConnect;
    config.CachePath = serverSettings.value.cachePath;
    config.MetadataPath = serverSettings.value.metadataPath;
    config.LibraryScanFanoutConcurrency = serverSettings.value.parallelLibraryScan;
    config.ParallelImageEncodingLimit = serverSettings.value.parallelImageEncoding;

    const brandingApi = remote.sdk.newUserApi(getBrandingApi);
    const brandingRes = await brandingApi.getBrandingOptions();
    const branding = brandingRes.data;

    branding.LoginDisclaimer = serverSettings.value.loginDisclaimer;
    branding.SplashscreenEnabled = serverSettings.value.enableSplash;

    await configApi.updateConfiguration({
      serverConfiguration: config
    });
    await configApi.updateNamedConfiguration({
      key: 'branding',
      body: JSON.stringify(branding)
    });

    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  loading.value = true;

  try {
    const localizationApi = remote.sdk.newUserApi(getLocalizationApi);

    culturesList.value = (
      await localizationApi.getLocalizationOptions()
    ).data;

    const configApi = remote.sdk.newUserApi(getConfigurationApi);
    const configRes = await configApi.getConfiguration();
    const config = configRes.data;

    serverSettings.value.name = config.ServerName;
    serverSettings.value.language = config.UICulture;
    serverSettings.value.quickConnect = config.QuickConnectAvailable;
    serverSettings.value.cachePath = config.CachePath;
    serverSettings.value.metadataPath = config.MetadataPath;
    serverSettings.value.parallelLibraryScan = config.LibraryScanFanoutConcurrency;
    serverSettings.value.parallelImageEncoding = config.ParallelImageEncodingLimit;

    const brandingApi = remote.sdk.newUserApi(getBrandingApi);
    const brandingRes = await brandingApi.getBrandingOptions();
    const branding = brandingRes.data;

    serverSettings.value.loginDisclaimer = branding.LoginDisclaimer;
    serverSettings.value.enableSplash = branding.SplashscreenEnabled;
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    loading.value = false;
  }
});
</script>
