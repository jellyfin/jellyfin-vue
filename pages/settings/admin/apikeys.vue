<template>
  <settings-page
    page-title="settingsSections.admin.apiKeys.name"
    :loading="loading"
  >
    <template #actions>
      <v-btn color="primary" @click="$refs.addKeyDialog.openDialog()">
        {{ $t('settings.apiKeys.addNewKey') }}
      </v-btn>
      <v-btn
        v-if="apiKeys.length"
        color="error"
        :loading="revokeKeyLoading"
        @click="revokeAllApiKeys"
      >
        {{ $t('settings.apiKeys.revokeAll') }}
      </v-btn>
    </template>
    <template #content>
      <v-data-table :headers="headers" :items="apiKeys">
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.DateCreated="{ item }">
          <p class="text-capitalize-first-letter mb-0">
            {{
              $dateFns.formatRelative(
                $dateFns.parseJSON(item.DateCreated),
                new Date(),
                { locale: $i18n.locale }
              )
            }}
          </p>
        </template>
      </v-data-table>
      <!-- Add API key dialog -->
      <add-api-key-dialog ref="addKeyDialog" @key-added="refreshApiKeys" />
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
  middleware: 'adminMiddleware',
  async asyncData({ $api }) {
    const apiKeys = (await $api.apiKey.getKeys()).data.Items;

    return { apiKeys };
  },
  data() {
    return {
      apiKeys: [] as AuthenticationInfo[],
      newKeyAppName: '',
      revokeKeyLoading: false,
      loading: false
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
  created() {
    this.setPageTitle({
      title: this.$t('settingsSections.admin.apiKeys.name')
    });
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('page', ['setPageTitle']),
    async revokeApiKey(token: string): Promise<void> {
      this.revokeKeyLoading = true;
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
      this.revokeKeyLoading = false;
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

      this.revokeKeyLoading = false;
    },
    async refreshApiKeys(): Promise<void> {
      this.loading = true;
      try {
        this.apiKeys = (await this.$api.apiKey.getKeys()).data.Items || [];
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.refreshKeysFailure'),
          color: 'error'
        });
      }
      this.loading = false;
    }
  }
});
</script>
