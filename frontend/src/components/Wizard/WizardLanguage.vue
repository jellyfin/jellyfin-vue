<template>
  <div>
    <v-select
      v-model="UICulture"
      :loading="loading"
      variant="outlined"
      :label="$t('wizard.preferedLanguage')"
      required
      item-title="Name"
      item-value="Value"
      :items="culturesList" />
    <v-btn color="primary" @click="setLanguage">
      {{ $t('next') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  LocalizationOption,
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
      console.error(error);
    }

    this.loading = false;
  },
  methods: {
    async setLanguage(): Promise<void> {
      this.loading = true;

      try {
        this.$i18n.locale = this.UICulture;
        this.$i18n.fallbackLocale;
        await this.$api.startup.updateInitialConfiguration({
          startupConfigurationDto: {
            ...this.initialConfig,
            UICulture: this.UICulture
          }
        });

        this.$emit('step-complete', { step: 1 });
      } catch (error) {
        console.error(error);
        this.useSnackbar(this.$t('wizard.setLanguageError'), 'error');
      }

      this.loading = false;
    }
  }
});
</script>
