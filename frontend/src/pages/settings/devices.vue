<template>
  <SettingsPage page-title="settings.devices.devices">
    <template #actions>
      <VBtn
        v-if="devices.length > 0"
        color="error"
        variant="elevated"
        class="ml-a"
        :loading="loading"
        @click="deleteAllDevices">
        {{ t('settings.devices.deleteAll') }}
      </VBtn>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/devices.html"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('settings.help') }}
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
              :key="device.Id ?? undefined">
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
                    ).value
                }}
              </td>
              <td>
                <VBtn
                  color="error"
                  :disabled="loading"
                  @click="confirmDelete = device.Id ?? undefined">
                  {{ t('settings.devices.delete') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
      <VDialog
        width="auto"
        :model-value="confirmDelete !== undefined"
        @update:model-value="confirmDelete = undefined">
        <VCard>
          <VCardText>
            {{ t('settings.devices.deleteConfirm') }}
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

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { parseJSON, formatRelative } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DeviceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useDateFns, useRemote, useSnackbar } from '@/composables';

const { t } = useI18n();
const remote = useRemote();

const devices = ref(
  (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ?? []
);

const loading = ref(false);
/** The device id to confirm being deleted (will be 'all' if all are being deleted) */
const confirmDelete = ref<string>();

const headers = computed<{ text: string; value: keyof DeviceInfo }[]>(() => [
  {
    text: t('settings.devices.userName'),
    value: 'LastUserName'
  },
  { text: t('settings.devices.deviceName'), value: 'Name' },
  { text: t('settings.devices.appName'), value: 'AppName' },
  { text: t('settings.devices.appVersion'), value: 'AppVersion' },
  {
    text: t('settings.devices.lastActive'),
    value: 'DateLastActivity'
  }
]);

/**
 * Deletes all remembered devices
 */
async function deleteAllDevices(): Promise<void> {
  loading.value = true;

  try {
    for (const device of devices.value) {
      if (!device.Id || remote.sdk.deviceInfo.id === device.Id) {
        continue;
      }

      await remote.sdk
        .newUserApi(getDevicesApi)
        .deleteDevice({ id: device.Id });
    }

    useSnackbar(t('settings.devices.deleteAllDevicesSuccess'), 'success');

    devices.value =
      (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ??
      [];
  } catch (error) {
    useSnackbar(t('settings.devices.deleteAllDevicesError'), 'error');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

/**
 * Deletes the selected device
 */
async function deleteDevice(deviceId: string): Promise<void> {
  loading.value = true;

  try {
    await remote.sdk.newUserApi(getDevicesApi).deleteDevice({ id: deviceId });

    useSnackbar(t('settings.devices.deleteDeviceSuccess'), 'success');

    devices.value =
      (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ??
      [];
  } catch (error) {
    useSnackbar(t('deleteDeviceError'), 'error');
    console.error(error);
  } finally {
    loading.value = false;
  }
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
