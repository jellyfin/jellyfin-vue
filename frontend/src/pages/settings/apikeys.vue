<template>
  <SettingsPage>
    <template #title>
      {{ t('apiKeys') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        :loading="loading"
        @click="addingNewKey = true">
        {{ t('addNewKey') }}
      </VBtn>
      <VBtn
        v-if="apiKeys.length"
        color="error"
        variant="elevated"
        :loading="loading"
        @click="confirmRevoke = 'all'">
        {{ t('revokeAll') }}
      </VBtn>
    </template>
    <template #content>
      <VCol>
        <VTable>
          <thead>
            <tr>
              <th
                v-for="{ text, value } in headers"
                :id="value"
                :key="value">
                {{ text }}
              </th>
              <th scope="col">
                <!-- delete column -->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="apiKey in apiKeys"
              :key="apiKey.AppName ?? undefined">
              <td
                v-for="{ value } in headers"
                :key="value">
                {{
                  value !== 'DateCreated'
                    ? apiKey[value]
                    : useDateFns(
                      formatRelative,
                      parseJSON(apiKey[value] ?? 'unknown'),
                      new Date()
                    )
                }}
              </td>
              <td>
                <VBtn
                  color="error"
                  :loading="loading"
                  @click="confirmRevoke = apiKey.AccessToken ?? undefined">
                  {{ t('revoke') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
      <AddApiKey
        :adding-new-key="addingNewKey"
        @close="addingNewKey = false"
        @key-added="
          async () => {
            addingNewKey = false;
            await refreshApiKeys();
          }
        " />
      <VDialog
        width="auto"
        :model-value="!isNil(confirmRevoke)"
        @update:model-value="confirmRevoke = undefined">
        <VCard>
          <VCardText>
            {{ t('revokeConfirm') }}
          </VCardText>
          <VCardActions>
            <VBtn
              color="primary"
              :loading="loading"
              @click="confirmRevocation">
              {{ t('confirm') }}
            </VBtn>
            <VBtn
              :loading="loading"
              @click="confirmRevoke = undefined">
              {{ t('cancel') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import { formatRelative, parseJSON } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';
import { useDateFns } from '#/composables/use-datefns';

const { t } = useI18n();

const apiKeys = ref<AuthenticationInfo[]>([]);
const addingNewKey = ref(false);
/** The key to confirm revocation (will be 'all' if revoking all keys) */
const confirmRevoke = ref<string>();
const loading = ref(false);

const headers = computed(
  (): { text: string; value: keyof AuthenticationInfo }[] => [
    { text: t('appName'), value: 'AppName' },
    { text: t('accessToken'), value: 'AccessToken' },
    { text: t('dateCreated'), value: 'DateCreated' }
  ]
);

/**
 * Confirms revocation and closes the confirmation modal
 */
async function confirmRevocation(): Promise<void> {
  if (!confirmRevoke.value) {
    return;
  }

  await (confirmRevoke.value === 'all'
    ? revokeAllApiKeys()
    : revokeApiKey(confirmRevoke.value));

  confirmRevoke.value = undefined;
}

/**
 * Revokes an api key
 */
async function revokeApiKey(token: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getApiKeyApi).revokeKey({
      key: token
    });

    useSnackbar(t('revokeSuccess'), 'success');
    await refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('revokeFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Revokes all api keys
 */
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

    useSnackbar(t('revokeAllSuccess'), 'success');
    await refreshApiKeys();
  } catch (error) {
    console.error(error);
    useSnackbar(t('revokeAllFailure'), 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Refreshes the list of api keys
 */
async function refreshApiKeys(): Promise<void> {
  try {
    apiKeys.value
      = (await remote.sdk.newUserApi(getApiKeyApi).getKeys()).data.Items ?? [];
  } catch (error) {
    apiKeys.value = [];
    console.error(error);
    useSnackbar(t('refreshKeysFailure'), 'error');
  }
}

await refreshApiKeys();
</script>
