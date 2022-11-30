<template>
  <v-dialog
    :model-value="addingNewKey"
    :width="width"
    @click:outside="() => (addingNewKey = false)">
    <v-col class="pa-0 add-key-dialog">
      <v-card>
        <v-card-title>{{ $t('settings.apiKeys.addApiKey') }}</v-card-title>
        <v-card-actions>
          <v-form class="add-key-form" @submit.prevent="addApiKey">
            <v-text-field
              v-model="newKeyAppName"
              variant="outlined"
              :label="$t('settings.apiKeys.appName')" />
            <v-btn color="primary" :loading="loading" @click="addApiKey">
              {{ $t('confirm') }}
            </v-btn>
            <v-btn @click="() => (addingNewKey = false)">
              {{ $t('cancel') }}
            </v-btn>
          </v-form>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { useSnackbar } from '@/composables';

export default defineComponent({
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      addingNewKey: false,
      newKeyAppName: '',
      loading: false
    };
  },
  computed: {
    width(): number | string {
      switch (this.$vuetify.display.name) {
        case 'xs': {
          return '100%';
        }
        case 'sm': {
          return 400;
        }
        case 'md': {
          return 500;
        }
        default: {
          return 600;
        }
      }
    }
  },
  methods: {
    async addApiKey(): Promise<void> {
      this.loading = true;

      try {
        await this.$remote.sdk.newUserApi(getApiKeyApi).createKey({
          app: this.newKeyAppName
        });

        this.useSnackbar(
          this.$t('settings.apiKeys.createKeySuccess'),
          'success'
        );

        this.newKeyAppName = '';
        this.$emit('key-added');
      } catch (error) {
        console.error(error);

        this.useSnackbar(this.$t('settings.apiKeys.createKeyFailure'), 'error');
      }

      this.loading = false;
      this.addingNewKey = false;
    },
    openDialog(): void {
      this.addingNewKey = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.add-key-form {
  width: 100%;
}
</style>
