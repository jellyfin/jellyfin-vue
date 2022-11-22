<template>
  <settings-page page-title="settings.apiKeys.apiKeys">
    <template #actions>
      <v-btn color="primary" @click="() => $refs.addKeyDialog.openDialog()">
        {{ $t('settings.apiKeys.addNewKey') }}
      </v-btn>
      <v-btn
        v-if="apiKeys.length > 0"
        color="error"
        :loading="revokeKeyLoading"
        @click="revokeAllApiKeys">
        {{ $t('settings.apiKeys.revokeAll') }}
      </v-btn>
    </template>
    <template #content>
      <v-col>
        <!-- TODO: Wait for Vuetify 3.1 -->
        <!-- <v-data-table :headers="headers" :items="apiKeys" class="elevation-2">
          <template #item.DateCreated="{ item }">
            <p class="text-capitalize-first-letter mb-0">
              {{
                $dateFns.formatRelative(
                  $dateFns.parseJSON(item.DateCreated),
                  new Date(),
                  {
                    locale: $i18n.locale
                  }
                )
              }}
            </p>
          </template>
        </v-data-table> -->
      </v-col>
      <!-- Add API key dialog -->
      <add-api-key ref="addKeyDialog" @key-added="refreshApiKeys" />
    </template>
  </settings-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client';
import { useSnackbar } from '@/composables';

interface TableHeaders {
  text: string;
  value: string;
}

export default defineComponent({
  setup() {
    return {
      useSnackbar
    };
  },
  async asyncData({ $api }) {
    const apiKeys = (await $api.apiKey.getKeys()).data.Items;

    return { apiKeys };
  },
  data() {
    return {
      apiKeys: [] as AuthenticationInfo[],
      addingNewKey: false,
      newKeyAppName: '',
      revokeKeyLoading: false
    };
  },
  computed: {
    headers(): TableHeaders[] {
      return [
        { text: this.$t('settings.apiKeys.appName'), value: 'AppName' },
        { text: this.$t('settings.apiKeys.accessToken'), value: 'AccessToken' },
        { text: this.$t('settings.apiKeys.dateCreated'), value: 'DateCreated' }
      ];
    }
  },
  methods: {
    async revokeApiKey(token: string): Promise<void> {
      try {
        await this.$api.apiKey.revokeKey({
          key: token
        });

        this.apiKeys.filter((item) => token !== item.AccessToken);
        this.useSnackbar(this.$t('settings.apiKeys.revokeSuccess'), 'success');
        this.refreshApiKeys();
      } catch (error) {
        console.error(error);
        this.useSnackbar(this.$t('settings.apiKeys.revokeFailure'), 'error');
      }
    },
    async revokeAllApiKeys(): Promise<void> {
      this.revokeKeyLoading = true;

      try {
        for (const key of this.apiKeys) {
          await this.$api.apiKey.revokeKey({
            key: key.AccessToken || ''
          });
        }

        this.apiKeys = [];
        this.useSnackbar(
          this.$t('settings.apiKeys.revokeAllSuccess'),
          'success'
        );
        this.refreshApiKeys();
      } catch (error) {
        console.error(error);
        this.useSnackbar(this.$t('settings.apiKeys.revokeAllFailure'), 'error');
      }

      this.revokeKeyLoading = false;
    },
    async refreshApiKeys(): Promise<void> {
      try {
        this.apiKeys = (await this.$api.apiKey.getKeys()).data.Items || [];
      } catch {
        this.useSnackbar(
          this.$t('settings.apiKeys.refreshKeysFailure'),
          'error'
        );
      }
    }
  }
});
</script>
