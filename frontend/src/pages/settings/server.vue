<template>
  <SettingsPage>
    <template #title>
      Server Settings
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <h3 class="mb-2 text-lg font-bold">
          General Server Settings
        </h3>

        <VTextField
          v-model="serverSettings.state.value.name"
          label="Server Name" />

        <VSelect
          v-model="serverSettings.state.value.language"
          :loading="loading"
          :disabled="loading"
          variant="outlined"
          :label="$t('preferredLanguage')"
          :rules="SomeItemSelectedRule"
          item-title="Name"
          item-value="Value"
          :items="culturesList" />

        <VCheckbox
          v-model="serverSettings.state.value.quickConnect"
          label="Enable Quick Connect" />

        <h3 class="text-lg font-bold mt-6 mb-2">
          Paths
        </h3>

        <VTextField
          v-model="serverSettings.state.value.cachePath"
          label="Cache Path" />

        <VTextField
          v-model="serverSettings.state.value.metadataPath"
          label="Metadata Path" />

        <h3 class="text-lg font-bold mt-6 mb-2">
          Branding
        </h3>

        <VTextField
          v-model="serverSettings.state.value.loginDisclaimer"
          label="Login Disclaimer" />

        <VTextField
          v-model="cssPreview"
          label="Custom CSS"
          readonly
          @click="openCssDialog" />

        <VCheckbox
          v-model="serverSettings.state.value.enableSplash"
          label="Enable Splash Screen" />

        <h3 class="text-lg font-bold mt-6 mb-2">
          Performance
        </h3>

        <VTextField
          v-model.number="serverSettings.state.value.parallelLibraryScan"
          label="Parallel Library Scan Limit"
          type="number" />

        <VTextField
          v-model.number="serverSettings.state.value.parallelImageEncoding"
          label="Parallel Image Encoding Limit"
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

      <VDialog
        v-model="cssDialog"
        persistent
        max-width="600px">
        <VCard>
          <VCardTitle>Edit Custom CSS</VCardTitle>
          <VCardText>
            <VTextarea
              v-model="serverSettings.state.value.customCSS"
              rows="10"
              auto-grow
              outlined />
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              text
              @click="cssDialog = false">
              Cancel
            </VBtn>
            <VBtn
              color="primary"
              @click="cssDialog = false">
              OK
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
  customCSS: string | undefined | null;
  enableSplash: boolean | undefined;
  parallelLibraryScan: number | undefined;
  parallelImageEncoding: number | undefined;
}

const serverSettings = ref<{ state: { value: ServerSettings } }>({
  state: {
    value: {
      name: '',
      language: '',
      quickConnect: false,
      cachePath: '',
      metadataPath: '',
      loginDisclaimer: '',
      customCSS: '',
      enableSplash: true,
      parallelLibraryScan: 0,
      parallelImageEncoding: 0
    }
  }
});

const cssDialog = ref(false);
const cssPreview = computed(() => {
  const css = serverSettings.value.state.value.customCSS ?? '';

  return css.length > 30 ? css.slice(0, 30) + '...' : css;
});

const loading = ref(false);
const saving = ref(false);
const culturesList = ref<LocalizationOption[]>([]);

/**
 * Opens the Css Dialog popup, potentially refactor to be a individual component?
 */
function openCssDialog() {
  cssDialog.value = true;
}

/**
 * * Saves the settings to the server
 */
async function saveSettings() {
  saving.value = true;

  try {
    const configApi = remote.sdk.newUserApi(getConfigurationApi);
    const configRes = await configApi.getConfiguration();
    const config = configRes.data;

    config.ServerName = serverSettings.value.state.value.name;
    config.UICulture = serverSettings.value.state.value.language;
    config.QuickConnectAvailable = serverSettings.value.state.value.quickConnect;
    config.CachePath = serverSettings.value.state.value.cachePath;
    config.MetadataPath = serverSettings.value.state.value.metadataPath;
    config.LibraryScanFanoutConcurrency = serverSettings.value.state.value.parallelLibraryScan;
    config.ParallelImageEncodingLimit = serverSettings.value.state.value.parallelImageEncoding;

    const brandingApi = remote.sdk.newUserApi(getBrandingApi);
    const brandingRes = await brandingApi.getBrandingOptions();
    const branding = brandingRes.data;

    branding.LoginDisclaimer = serverSettings.value.state.value.loginDisclaimer;
    branding.CustomCss = serverSettings.value.state.value.customCSS;
    branding.SplashscreenEnabled = serverSettings.value.state.value.enableSplash;

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

    serverSettings.value.state.value.name = config.ServerName;
    serverSettings.value.state.value.language = config.UICulture;
    serverSettings.value.state.value.quickConnect = config.QuickConnectAvailable;
    serverSettings.value.state.value.cachePath = config.CachePath;
    serverSettings.value.state.value.metadataPath = config.MetadataPath;
    serverSettings.value.state.value.parallelLibraryScan = config.LibraryScanFanoutConcurrency;
    serverSettings.value.state.value.parallelImageEncoding = config.ParallelImageEncodingLimit;

    const brandingApi = remote.sdk.newUserApi(getBrandingApi);
    const brandingRes = await brandingApi.getBrandingOptions();
    const branding = brandingRes.data;

    serverSettings.value.state.value.loginDisclaimer = branding.LoginDisclaimer;
    serverSettings.value.state.value.customCSS = branding.CustomCss;
    serverSettings.value.state.value.enableSplash = branding.SplashscreenEnabled;
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    loading.value = false;
  }
});
</script>
