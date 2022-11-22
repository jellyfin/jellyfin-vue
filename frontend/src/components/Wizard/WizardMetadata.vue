<template>
  <div>
    <v-select
      v-model="metadataLanguage"
      variant="outlined"
      :label="$t('metadataLanguage')"
      required
      item-title="DisplayName"
      item-value="TwoLetterISOLanguageName"
      :items="cultureOptions" />
    <v-select
      v-model="metadataCountry"
      variant="outlined"
      :label="$t('metadataCountry')"
      required
      item-title="DisplayName"
      item-value="TwoLetterISORegionName"
      :items="countryOptions" />
    <v-btn color="secondary" @click="$emit('previous-step', { step: 2 })">
      {{ $t('previous') }}
    </v-btn>
    <v-btn :loading="loading" color="primary" @click="setMetadata">
      {{ $t('next') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  CountryInfo,
  CultureDto,
  StartupConfigurationDto
} from '@jellyfin/sdk/lib/generated-client';
import { useSnackbar } from '@/composables';

export default defineComponent({
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      metadataLanguage: '',
      metadataCountry: '',
      initialConfig: {} as StartupConfigurationDto,
      cultureOptions: [] as CultureDto[],
      countryOptions: [] as CountryInfo[],
      loading: false
    };
  },
  async created() {
    this.initialConfig = (
      await this.$api.startup.getStartupConfiguration()
    ).data;

    this.metadataLanguage = this.initialConfig?.MetadataCountryCode || '';
    this.metadataCountry = this.initialConfig?.PreferredMetadataLanguage || '';

    this.cultureOptions = (await this.$api.localization.getCultures()).data;
    this.countryOptions = (await this.$api.localization.getCountries()).data;
  },
  methods: {
    async setMetadata(): Promise<void> {
      this.loading = true;

      try {
        await this.$api.startup.updateInitialConfiguration({
          startupConfigurationDto: {
            ...this.initialConfig,
            MetadataCountryCode: this.metadataLanguage,
            PreferredMetadataLanguage: this.metadataCountry
          }
        });

        this.$emit('step-complete', { step: 3 });
      } catch (error) {
        console.error(error);
        this.useSnackbar(this.$t('wizard.setMetadataError'), 'error');
      }

      this.loading = false;
    }
  }
});
</script>
