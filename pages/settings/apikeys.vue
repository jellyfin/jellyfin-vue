<template>
  <settings-page page-title="settings.apiKeys.apiKeys">
    <template #actions>
      <v-btn color="primary" @click="() => $refs.addKeyDialog.openDialog()">
        {{ $t('settings.apiKeys.addNewKey') }}
      </v-btn>
      <v-btn v-if="apiKeys.length" color="error" @click="revokeAllApiKeys">
        {{ $t('settings.apiKeys.revokeAll') }}
      </v-btn>
    </template>
    <template #content>
      <v-col>
        <v-data-table :headers="headers" :items="apiKeys" class="elevation-1">
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.DateCreated="{ item }">
            <p class="text-capitalize-first-letter mb-0">
              {{
                $dateFns.formatRelative(
                  $dateFns.parseJSON(item.DateCreated),
                  new Date()
                )
              }}
            </p>
          </template>
        </v-data-table>
      </v-col>
      <!-- Add API key dialog -->
      <add-api-key ref="addKeyDialog" @key-added="refreshApiKeys" />
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { AuthenticationInfo } from '@jellyfin/client-axios';

interface TableHeaders {
  text: string;
  value: string;
}

export default Vue.extend({
  async asyncData({ $api }) {
    const apiKeys = (await $api.apiKey.getKeys()).data.Items;

    return { apiKeys };
  },
  data() {
    return {
      apiKeys: [] as AuthenticationInfo[],
      addingNewKey: false,
      newKeyAppName: ''
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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async revokeApiKey(token: string): Promise<void> {
      try {
        await this.$api.apiKey.revokeKey({
          key: token
        });

        this.apiKeys.filter((item) => token !== item.AccessToken);

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.revokeSuccess'),
          color: 'success'
        });

        this.refreshApiKeys();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.revokeFailure'),
          color: 'error'
        });
      }
    },
    async revokeAllApiKeys(): Promise<void> {
      try {
        for (const key of this.apiKeys) {
          await this.$api.apiKey.revokeKey({
            key: key.AccessToken || ''
          });
        }

        this.apiKeys = [];

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.revokeAllSuccess'),
          color: 'success'
        });

        this.refreshApiKeys();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.revokeAllFailure'),
          color: 'error'
        });
      }
    },
    async refreshApiKeys(): Promise<void> {
      try {
        this.apiKeys = (await this.$api.apiKey.getKeys()).data.Items || [];
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.refreshKeysFailure'),
          color: 'error'
        });
      }
    }
  }
});
</script>
