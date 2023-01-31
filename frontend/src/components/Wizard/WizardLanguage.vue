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
    <v-btn color="primary" variant="elevated" @click="setLanguage">
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
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useSnackbar } from '@/composables';

export default defineComponent({
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      UICulture: 'en-US',
      culturesList: [] as LocalizationOption[],
      initialConfig: {} as StartupConfigurationDto,
      loading: false
    };
  },
  async created() {
    this.loading = true;

    const api = this.$remote.sdk.oneTimeSetup(
      this.$remote.auth.currentServer?.PublicAddress || ''
    );

    try {
      this.initialConfig = (
        await getStartupApi(api).getStartupConfiguration()
      ).data;

      this.UICulture = this.initialConfig?.UICulture || 'en-GB';

      this.culturesList = (
        await getLocalizationApi(api).getLocalizationOptions()
      ).data;
    } catch (error) {
      console.error(error);
    }

    this.loading = false;
  },
  methods: {
    async setLanguage(): Promise<void> {
      this.loading = true;

      const api = this.$remote.sdk.oneTimeSetup(
        this.$remote.auth.currentServer?.PublicAddress || ''
      );

      try {
        this.$i18n.locale = this.UICulture;
        await getStartupApi(api).updateInitialConfiguration({
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
