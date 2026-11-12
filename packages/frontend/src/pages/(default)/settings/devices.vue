<template>
  <SettingsPage>
    <template #title>
      {{ t('devices') }}
    </template>
    <template #actions>
      <VBtn
        v-if="deletableDeviceIds.length"
        color="error"
        variant="elevated"
        class="ml-a"
        :loading="loading"
        @click="confirmDelete = 'all'">
        {{ t('deleteAll') }}
      </VBtn>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/devices.html"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('help') }}
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
                <!--for delete button-->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in devices"
              :key="`${device.Id}|${device.LastUserId}`">
              <td
                v-for="{ value } in headers"
                :key="value">
                {{
                  value !== 'DateLastActivity'
                    ? device[value]
                    : useDateFns(
                      formatRelative,
                      parseJSON(device[value] ?? 'unknown'),
                      new Date()
                    )
                }}
              </td>
              <td>
                <VBtn
                  color="error"
                  :disabled="loading || device.Id === remote.sdk.deviceInfo.id"
                  @click="confirmDelete = device.Id ?? undefined">
                  {{ t('delete') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
      <VDialog
        width="auto"
        :model-value="!isNil(confirmDelete)"
        @update:model-value="confirmDelete = undefined">
        <VCard>
          <VCardText>
            {{ t('deleteConfirm') }}
          </VCardText>
          <VCardActions>
            <VBtn
              color="primary"
              :loading="loading"
              @click="confirmDeletion">
              {{ t('confirm') }}
            </VBtn>
            <VBtn
              :loading="loading"
              @click="confirmDelete = undefined">
              {{ t('cancel') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client';
import { getDeviceApi } from '@jellyfin/sdk/lib/utils/api/device-api';
import { formatRelative, parseJSON } from 'date-fns';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { useDateFns } from '#/composables/use-datefns.ts';

definePage({
  meta: {
    admin: true,
    layout: {
      transition: {}
    }
  }
});

const { t } = useTranslation();

const devices = ref(
  (await remote.sdk.newUserApi(getDeviceApi).getDevices()).data.Items ?? []
);

const loading = ref(false);
/** The device id to confirm being deleted (will be 'all' if all are being deleted) */
const confirmDelete = ref<string>();

const headers = computed<{ text: string; value: keyof DeviceInfoDto }[]>(() => [
  {
    text: t('userName'),
    value: 'LastUserName'
  },
  { text: t('deviceName'), value: 'Name' },
  { text: t('appName'), value: 'AppName' },
  { text: t('appVersion'), value: 'AppVersion' },
  {
    text: t('lastActive'),
    value: 'DateLastActivity'
  }
]);

/**
 * Ids of the devices that can be deleted: all of them except the one in use, since deleting it
 * revokes its access token, ending the user's own session. The server lists one row per user
 * signed in on a device, so an id can appear more than once, and deleting it removes every row.
 */
const deletableDeviceIds = computed(() => [
  ...new Set(
    devices.value
      .map(device => device.Id)
      .filter((id): id is string => !!id && id !== remote.sdk.deviceInfo.id)
  )
]);

/**
 * Fetches the list of devices again, so it reflects what's on the server
 */
async function refreshDevices(): Promise<void> {
  try {
    devices.value
      = (await remote.sdk.newUserApi(getDeviceApi).getDevices()).data.Items
        ?? [];
  } catch (error) {
    console.error(error);
  }
}

/**
 * Deletes all remembered devices, except the one in use.
 *
 * Every deletion is attempted even if some fail, and the list is refreshed afterwards,
 * so it doesn't keep showing devices that were already deleted.
 */
async function deleteAllDevices(): Promise<void> {
  loading.value = true;

  let failed = false;

  for (const id of deletableDeviceIds.value) {
    try {
      await remote.sdk.newUserApi(getDeviceApi).deleteDevice({ id: [id] });
    } catch (error) {
      failed = true;
      console.error(error);
    }
  }

  if (failed) {
    useSnackbar(t('deleteAllDevicesError'), 'error');
  } else {
    useSnackbar(t('deleteAllDevicesSuccess'), 'success');
  }

  await refreshDevices();
  loading.value = false;
}

/**
 * Deletes the selected device
 */
async function deleteDevice(deviceId: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getDeviceApi).deleteDevice({ id: [deviceId] });

    useSnackbar(t('deleteDeviceSuccess'), 'success');
  } catch (error) {
    useSnackbar(t('deleteDeviceError'), 'error');
    console.error(error);
  }

  await refreshDevices();
  loading.value = false;
}

/**
 * Confirms deleteion of a single device or all
 */
async function confirmDeletion(): Promise<void> {
  if (!confirmDelete.value) {
    return;
  }

  await (confirmDelete.value === 'all'
    ? deleteAllDevices()
    : deleteDevice(confirmDelete.value));

  confirmDelete.value = undefined;
}
</script>
