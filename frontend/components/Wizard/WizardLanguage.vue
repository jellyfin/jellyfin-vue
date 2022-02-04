<template>
  <div>
    <v-select
      v-model="UICulture"
      :loading="loading"
      outlined
      :label="$t('wizard.preferedLanguage')"
      required
      item-text="Name"
      item-value="Value"
      :items="culturesList"
    />
    <v-btn color="primary" @click="setLanguage">
      {{ $t('next') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import {
  LocalizationOption,
  StartupConfigurationDto
} from '@jellyfin/client-axios';

export default Vue.extend({
  auth: false,
  data() {
    return {
      UICulture: 'en-GB',
      culturesList: [] as LocalizationOption[],
      initialConfig: {} as StartupConfigurationDto,
      loading: false
    };
  },
  async created() {
    this.loading = true;

    try {
      this.initialConfig = (
        await this.$api.startup.getStartupConfiguration()
      ).data;

      this.UICulture = this.initialConfig?.UICulture || 'en-GB';

      this.culturesList = (
        await this.$api.localization.getLocalizationOptions()
      ).data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    this.loading = false;
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async setLanguage(): Promise<void> {
      this.loading = true;

      try {
        this.$i18n.setLocale(this.UICulture);
        await this.$api.startup.updateInitialConfiguration({
          startupConfigurationDto: {
            ...this.initialConfig,
            UICulture: this.UICulture
          }
        });

        this.$emit('step-complete', { step: 1 });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('wizard.setLanguageError'),
          color: 'error'
        });
      }

      this.loading = false;
    }
  }
});
</script>
