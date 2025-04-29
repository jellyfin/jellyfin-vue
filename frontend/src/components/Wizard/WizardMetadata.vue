<template>
  <div>
    <VSelect
      v-model="metadataLanguage"
      variant="outlined"
      :label="t('metadataLanguage')"
      :rules="SomeItemSelectedRule"
      item-title="DisplayName"
      item-value="TwoLetterISOLanguageName"
      :items="cultureOptions"
      :disabled="loading" />
    <VSelect
      v-model="metadataCountry"
      variant="outlined"
      :label="t('metadataCountry')"
      :rules="SomeItemSelectedRule"
      item-title="DisplayName"
      item-value="TwoLetterISORegionName"
      :items="countryOptions"
      :disabled="loading" />
    <VBtn
      color="secondary"
      variant="elevated"
      :disabled="loading"
      @click="emit('previous-step')">
      {{ t('previous') }}
    </VBtn>
    <VBtn
      :loading="loading"
      color="primary"
      variant="elevated"
      @click="setMetadata">
      {{ t('next') }}
    </VBtn>
  </div>
</template>

<script setup lang="ts">
import type {
  CountryInfo,
  CultureDto,
  StartupConfigurationDto
} from '@jellyfin/sdk/lib/generated-client';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { onMounted, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { SomeItemSelectedRule } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';

const emit = defineEmits<{
  'step-complete': [];
  'previous-step': [];
}>();

const { t } = useTranslation();

const metadataLanguage = ref('');
const metadataCountry = ref('');
const initialConfig = ref<StartupConfigurationDto>({});
const cultureOptions = ref<CultureDto[]>([]);
const countryOptions = ref<CountryInfo[]>([]);
const loading = ref(false);

onMounted(async () => {
  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  initialConfig.value = (
    await getStartupApi(api).getStartupConfiguration()
  ).data;

  metadataLanguage.value = initialConfig.value.MetadataCountryCode ?? '';
  metadataCountry.value = initialConfig.value.PreferredMetadataLanguage ?? '';

  cultureOptions.value = (await getLocalizationApi(api).getCultures()).data;
  countryOptions.value = (await getLocalizationApi(api).getCountries()).data;
});

/**
 * Update metadata preferences and continue to next step
 */
async function setMetadata(): Promise<void> {
  loading.value = true;

  const api = remote.sdk.oneTimeSetup(
    remote.auth.currentServer.value?.PublicAddress ?? ''
  );

  try {
    await getStartupApi(api).updateInitialConfiguration({
      startupConfigurationDto: {
        ...initialConfig.value,
        MetadataCountryCode: metadataLanguage.value,
        PreferredMetadataLanguage: metadataCountry.value
      }
    });

    emit('step-complete');
  } catch (error) {
    console.error(error);
    useSnackbar(t('setMetadataError'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
