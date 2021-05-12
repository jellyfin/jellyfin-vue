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
import {
  CountryInfo,
  CultureDto,
  StartupConfigurationDto
} from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions } from 'vuex';

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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async setMetadata(): Promise<void> {
      this.loading = true;

      try {
        await this.$api.startup.updateInitialConfiguration({
          uNKNOWNBASETYPE: {
            ...this.initialConfig,
            MetadataCountryCode: this.metadataLanguage,
            PreferredMetadataLanguage: this.metadataCountry
          }
        });

        this.$emit('step-complete', { step: 3 });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('wizard.setMetadataError'),
          color: 'error'
        });
      }

      this.loading = false;
    }
  }
});
</script>
