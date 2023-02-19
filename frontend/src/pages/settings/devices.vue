<template>
  <settings-page page-title="settings.devices.devices">
    <template #actions>
      <v-btn
        v-if="devices"
        color="error"
        variant="elevated"
        class="ml-a"
        @click="deleteAllDevices">
        {{ $t('settings.devices.deleteAll') }}
      </v-btn>
      <v-btn
        rel="noreferrer noopener"
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/devices.html"
        target="_blank">
        {{ $t('settings.help') }}
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
                $dateFns.formatRelative(
                  $dateFns.parseJSON(item.DateLastActivity),
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
      <v-dialog v-model="deviceInfoDialog" width="fit-content">
        <selected-device-info
          v-if="selectedDevice.Name"
          :selected-device="selectedDevice"
          :is-dialog="true"
          @close-dialog="closeDialog"
          @delete-selected="deleteSelectedDevice" />
      </v-dialog>
    </template>
  </settings-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { DeviceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useRemote, useSnackbar } from '@/composables';

export default defineComponent({
  async setup() {
    const remote = useRemote();

    const devices = (await remote.sdk.newUserApi(getDevicesApi).getDevices())
      .data.Items;

    return {
      devices,
      useSnackbar
    };
  },
  data() {
    return {
      selectedDevice: {} as DeviceInfo,
      deviceInfoDialog: false
    };
  },
  computed: {
    headers(): { text: string; value: string }[] {
      return [
        {
          text: this.$t('settings.devices.userName'),
          value: 'LastUserName'
        },
        { text: this.$t('settings.devices.deviceName'), value: 'Name' },
        { text: this.$t('settings.devices.appName'), value: 'AppName' },
        { text: this.$t('settings.devices.appVersion'), value: 'AppVersion' },
        {
          text: this.$t('settings.devices.lastActive'),
          value: 'DateLastActivity'
        }
      ];
    }
  },
  methods: {
    async deleteDevice(item: DeviceInfo): Promise<void> {
      try {
        await this.$remote.sdk.newUserApi(getDevicesApi).deleteDevice({
          id: item.Id || ''
        });

        this.useSnackbar(
          this.$t('settings.devices.deleteDeviceSuccess'),
          'success'
        );
        this.devices =
          (await this.$remote.sdk.newUserApi(getDevicesApi).getDevices()).data
            .Items || [];
      } catch (error) {
        this.useSnackbar(
          this.$t('settings.devices.deleteDeviceError'),
          'error'
        );

        console.error(error);
      }
    },
    async deleteAllDevices(): Promise<void> {
      try {
        this.devices?.forEach(async (device) => {
          if (this.$remote.sdk.deviceInfo.id === device.Id) {
            return;
          }

          await this.$remote.sdk
            .newUserApi(getDevicesApi)
            .deleteDevice({ id: device.Id || '' });
        });

        this.useSnackbar(
          this.$t('settings.devices.deleteAllDevicesSuccess'),
          'success'
        );

        this.devices =
          (await this.$remote.sdk.newUserApi(getDevicesApi).getDevices()).data
            .Items || [];
      } catch (error) {
        this.useSnackbar(
          this.$t('settings.devices.deleteAllDevicesError'),
          'error'
        );

        console.error(error);
      }
    },
    setSelectedDevice(device: DeviceInfo): void {
      this.selectedDevice = device;
      this.deviceInfoDialog = true;
    },
    closeDialog(): void {
      this.deviceInfoDialog = false;
      this.selectedDevice = {};
    },
    async deleteSelectedDevice(): Promise<void> {
      try {
        await this.$remote.sdk.newUserApi(getDevicesApi).deleteDevice({
          id: this.selectedDevice.Id || ''
        });

        this.useSnackbar(
          this.$t('settings.devices.deleteDeviceSuccess'),
          'success'
        );

        this.selectedDevice = {};

        this.devices =
          (await this.$remote.sdk.newUserApi(getDevicesApi).getDevices()).data
            .Items || [];
      } catch (error) {
        this.useSnackbar(this.$t('deleteDeviceError'), 'error');

        console.error(error);
      }

      this.deviceInfoDialog = false;
    }
  }
});
</script>
