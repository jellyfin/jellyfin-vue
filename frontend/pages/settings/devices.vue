<template>
  <settings-page page-title="settings.devices.devices">
    <template #actions>
      <v-btn
        v-if="devices"
        color="error"
        class="ml-a"
        @click="deleteAllDevices"
      >
        {{ $t('settings.devices.deleteAll') }}
      </v-btn>
      <v-btn
        rel="noreferrer noopener"
        href="https://jellyfin.org/docs/general/server/devices.html"
        target="_blank"
      >
        {{ $t('settings.help') }}
      </v-btn>
    </template>
    <template #content>
      <v-col>
        <v-data-table
          :headers="headers"
          :items="devices"
          @click:row="setSelectedDevice"
        >
          <!-- eslint-disable-next-line vue/valid-v-slot -->
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
        </v-data-table>
      </v-col>
      <v-dialog v-model="deviceInfoDialog" width="fit-content">
        <selected-device-info
          v-if="selectedDevice.Name"
          :selected-device="selectedDevice"
          :is-dialog="true"
          @close-dialog="closeDialog"
          @delete-selected="deleteSelectedDevice"
        />
      </v-dialog>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { DeviceInfo } from '@jellyfin/client-axios';
import { deviceProfileStore, snackbarStore } from '~/store';

export default Vue.extend({
  async asyncData({ $api }) {
    const devices = (await $api.devices.getDevices()).data.Items;

    return { devices };
  },
  data() {
    return {
      devices: [] as DeviceInfo[],
      selectedDevice: {} as DeviceInfo,
      deviceInfoDialog: false
    };
  },
  computed: {
    ...mapStores(deviceProfileStore, snackbarStore),
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
        await this.$api.devices.deleteDevice({
          id: item.Id || ''
        });

        this.snackbar.push(
          this.$t('settings.devices.deleteDeviceSuccess'),
          'success'
        );
        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.snackbar.push(
          this.$t('settings.devices.deleteDeviceError'),
          'error'
        );
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
    async deleteAllDevices(): Promise<void> {
      try {
        this.devices?.forEach(async (device) => {
          if (this.deviceProfile.deviceId === device.Id) {
            return;
          }

          await this.$api.devices.deleteDevice({ id: device.Id || '' });
        });

        this.snackbar.push(
          this.$t('settings.devices.deleteAllDevicesSuccess'),
          'success'
        );

        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.snackbar.push(
          this.$t('settings.devices.deleteAllDevicesError'),
          'error'
        );

        // eslint-disable-next-line no-console
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
        await this.$api.devices.deleteDevice({
          id: this.selectedDevice.Id || ''
        });

        this.snackbar.push(
          this.$t('settings.devices.deleteDeviceSuccess'),
          'success'
        );

        this.selectedDevice = {};

        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.snackbar.push(this.$t('deleteDeviceError'), 'error');

        // eslint-disable-next-line no-console
        console.error(error);
      }

      this.deviceInfoDialog = false;
    }
  }
});
</script>
