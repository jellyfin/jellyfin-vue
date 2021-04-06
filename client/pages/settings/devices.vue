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
        ref="noreferrer noopener"
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
import { mapActions, mapState } from 'vuex';
import { DeviceInfo } from '@jellyfin/client-axios';

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
    ...mapState('deviceProfile', ['deviceId']),
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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async deleteDevice(item: DeviceInfo): Promise<void> {
      try {
        await this.$api.devices.deleteDevice({
          id: item.Id || ''
        });

        this.pushSnackbarMessage({
          message: this.$t('settings.devices.deleteDeviceSuccess'),
          color: 'success'
        });

        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('settings.devices.deleteDeviceError'),
          color: 'error'
        });

        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
    async deleteAllDevices(): Promise<void> {
      try {
        await this.devices?.forEach(async (device) => {
          if (this.deviceId === device.Id) {
            return;
          }

          await this.$api.devices.deleteDevice({ id: device.Id || '' });
        });

        this.pushSnackbarMessage({
          message: this.$t('settings.devices.deleteAllDevicesSuccess'),
          color: 'success'
        });

        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('settings.devices.deleteAllDevicesError'),
          color: 'error'
        });

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

        this.pushSnackbarMessage({
          message: this.$t('settings.devices.deleteDeviceSuccess'),
          color: 'success'
        });

        this.selectedDevice = {};

        this.devices = (await this.$api.devices.getDevices()).data.Items || [];
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('deleteDeviceError'),
          color: 'error'
        });

        // eslint-disable-next-line no-console
        console.error(error);
      }

      this.deviceInfoDialog = false;
    }
  }
});
</script>
