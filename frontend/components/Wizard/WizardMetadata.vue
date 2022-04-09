<template>
  <div>
    <v-select
      v-model="metadataLanguage"
      outlined
      :label="$t('metadataLanguage')"
      required
      item-text="DisplayName"
      item-value="TwoLetterISOLanguageName"
      :items="cultureOptions"
    />
    <v-select
      v-model="metadataCountry"
      outlined
      :label="$t('metadataCountry')"
      required
      item-text="DisplayName"
      item-value="TwoLetterISORegionName"
      :items="countryOptions"
    />
    <v-btn color="secondary" @click="$emit('previous-step', { step: 2 })">
      {{ $t('previous') }}
    </v-btn>
    <v-btn :loading="loading" color="primary" @click="setMetadata">
      {{ $t('next') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  CountryInfo,
  CultureDto,
  StartupConfigurationDto
} from '@jellyfin/client-axios';
import { mapStores } from 'pinia';
import { snackbarStore } from '~/store';

export default Vue.extend({
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
  computed: {
    ...mapStores(snackbarStore)
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
        // eslint-disable-next-line no-console
        console.error(error);
        this.snackbar.push(this.$t('wizard.setMetadataError'), 'error');
      }

      this.loading = false;
    }
  }
});
</script>
