<template>
  <settings-page page-title="settings.devices.devices">
    <template #actions>
      <v-btn
        v-if="devices.length > 0"
        color="error"
        variant="elevated"
        class="ml-a"
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
      </v-col>
      <v-dialog
        :model-value="selectedDevice !== undefined"
        width="fit-content"
        @update:model-value="selectedDevice = undefined">
        <selected-device-info
          v-if="selectedDevice"
          :selected-device="selectedDevice"
          @close-dialog="selectedDevice = undefined"
          @delete-selected="deleteSelectedDevice()" />
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
  try {
    for (const device of devices.value) {
      if (!device.Id || remote.sdk.deviceInfo.id === device.Id) {
        return;
      }

      await remote.sdk
        .newUserApi(getDevicesApi)
        .deleteDevice({ id: device.Id || '' });
    }

    useSnackbar(t('settings.devices.deleteAllDevicesSuccess'), 'success');

    devices.value =
      (await remote.sdk.newUserApi(getDevicesApi).getDevices()).data.Items ??
      [];
  } catch (error) {
    useSnackbar(t('settings.devices.deleteAllDevicesError'), 'error');
    console.error(error);
  }
}

/** sets the device that the user currently has focused */
function setSelectedDevice(device: DeviceInfo): void {
  selectedDevice.value = device;
}

/** unsets the device  */
function closeDialog(): void {
  selectedDevice.value = undefined;
}

/** deletes the selected device */
async function deleteSelectedDevice(): Promise<void> {
  if (!selectedDevice.value?.Id) {
    return;
  }

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
  }

  selectedDevice.value = undefined;
}
</script>
