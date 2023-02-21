<template>
  <settings-page page-title="settings.apiKeys.apiKeys">
    <template #actions>
      <v-btn
        color="primary"
        variant="elevated"
        :loading="loading"
        @click="addingNewKey = true">
        {{ t('settings.apiKeys.addNewKey') }}
      </v-btn>
      <v-btn
        v-if="apiKeys.length > 0"
        color="error"
        variant="elevated"
        :loading="loading"
        @click="revokeAllApiKeys">
        {{ t('settings.apiKeys.revokeAll') }}
      </v-btn>
    </template>
    <template #content>
      <v-col>
        <v-table>
          <thead>
            <tr>
              <th v-for="{ text, value } in headers" :key="value">
                {{ text }}
              </th>
              <th><!-- delete column --></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apiKey in apiKeys" :key="apiKey.AppName ?? undefined">
              <td v-for="{ value } in headers" :key="value">
                {{
                  value !== 'DateCreated'
                    ? apiKey[value]
                    : useDateFns(
                        formatRelative,
                        parseJSON(apiKey[value] ?? 'unknown'),
                        new Date()
                      ).value
                }}
              </td>
              <td>
                <v-btn
                  color="error"
                  :loading="loading"
                  @click="
                    apiKey.AccessToken && revokeApiKey(apiKey.AccessToken)
                  ">
                  {{ t('settings.apiKeys.revoke') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <!-- Add API key dialog -->
      <add-api-key
        :adding-new-key="addingNewKey"
        @close="addingNewKey = false"
        @key-added="
          addingNewKey = false;
          refreshApiKeys();
        " />
    </template>
  </settings-page>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { parseJSON, formatRelative } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client';
import { useDateFns, useRemote, useSnackbar } from '@/composables';

const { t } = useI18n();
const remote = useRemote();

const apiKeys = ref<AuthenticationInfo[]>([]);
const addingNewKey = ref(false);
const loading = ref(false);

const headers = computed(
  (): { text: string; value: keyof AuthenticationInfo }[] => [
    { text: t('settings.apiKeys.appName'), value: 'AppName' },
    { text: t('settings.apiKeys.accessToken'), value: 'AccessToken' },
    { text: t('settings.apiKeys.dateCreated'), value: 'DateCreated' }
  ]
);

/** Revokes an api key */
async function revokeApiKey(token: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getApiKeyApi).revokeKey({
      key: token
    });

    useSnackbar(t('settings.apiKeys.revokeSuccess'), 'success');
    refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('settings.apiKeys.revokeFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/** revokes all api keys */
async function revokeAllApiKeys(): Promise<void> {
  loading.value = true;

  try {
    for (const key of apiKeys.value) {
      if (key.AccessToken) {
        await remote.sdk.newUserApi(getApiKeyApi).revokeKey({
          key: key.AccessToken
        });
      }
    }

    useSnackbar(t('settings.apiKeys.revokeAllSuccess'), 'success');
    refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('settings.apiKeys.revokeAllFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/** refreshes the list of api keys */
async function refreshApiKeys(): Promise<void> {
  try {
    apiKeys.value =
      (await remote.sdk.newUserApi(getApiKeyApi).getKeys()).data.Items ?? [];
  } catch (error) {
    apiKeys.value = [];
    console.error(error);
    useSnackbar(t('settings.apiKeys.refreshKeysFailure'), 'error');
  }
}

await refreshApiKeys();
</script>
