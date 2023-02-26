<template>
  <settings-page page-title="settings.devices.devices">
    <template #actions>
      <v-btn
        v-if="devices.length > 0"
        color="error"
        variant="elevated"
        class="ml-a"
        :loading="loading"
        @click="deleteAllDevices">
        {{ t('settings.devices.deleteAll') }}
      </v-btn>
      <v-btn
        rel="noreferrer noopener"
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/devices.html"
        target="_blank">
        {{ t('settings.help') }}
      </v-btn>
    </template>
    <template #content>
      <v-col>
        <!-- TODO: Wait for Vuetify implementation (https://github.com/vuetifyjs/vuetify/issues/13479) -->
        <!-- <v-data-table
          :headers="headers"
          :items="devices"
          @click:row="setSelectedDevice"
        >
          <template #item.DateLastActivity="{ item }">
            <p class="text-capitalize-first-letter mb-0">
              {{
                useDateFns(
                  formatRelative,
                  parseJSON(item.DateCreated),
                  new Date()
                ).value
              }}
            </p>
          </template>
        </v-data-table> -->
        <v-table>
          <thead>
            <tr>
              <th v-for="{ text, value } in headers" :key="value">
                {{ text }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in devices"
              :key="device.Id ?? undefined"
              @click="selectedDevice = device">
              <td v-for="{ value } in headers" :key="value">
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
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-dialog
        :model-value="selectedDevice !== undefined"
        width="fit-content"
        @update:model-value="selectedDevice = undefined">
        <selected-device-info
          v-if="selectedDevice"
          :disabled="loading"
          :selected-device="selectedDevice"
          @close-dialog="selectedDevice = undefined"
          @delete-selected="confirmDelete = selectedDevice?.Id ?? undefined" />
      </v-dialog>
      <v-dialog
        width="auto"
        :model-value="confirmDelete !== undefined"
        @update:model-value="confirmDelete = undefined">
        <v-card>
          <v-card-text>
            {{ t('settings.devices.deleteConfirm') }}
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" :loading="loading" @click="confirmDeletion">
              {{ t('confirm') }}
            </v-btn>
            <v-btn :loading="loading" @click="confirmDelete = undefined">
              {{ t('cancel') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
import { DeviceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useDateFns, useRemote, useSnackbar } from '@/composables';

const { t } = useI18n();
const remote = useRemote();

const devices = ref(
  (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ?? []
);

const selectedDevice = ref<DeviceInfo>();
const loading = ref(false);
/** the device id to confirm being deleted (will be 'all' if all are being deleted) */
const confirmDelete = ref<string>();

const headers = computed((): { text: string; value: keyof DeviceInfo }[] => [
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

/** deletes all remembered devices */
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

/** deletes the selected device */
async function deleteDevice(id: string): Promise<void> {
  if (!selectedDevice.value?.Id) {
    return;
  }

  loading.value = true;

  try {
    await remote.sdk
      .newUserApi(getDevicesApi)
      .deleteDevice({ id: selectedDevice.value.Id });

    useSnackbar(t('settings.devices.deleteDeviceSuccess'), 'success');

    selectedDevice.value = undefined;

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

/** confirms deleteion of a single device or all */
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
