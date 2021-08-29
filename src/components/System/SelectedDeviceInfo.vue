<template>
  <v-card class="selected-device-card">
    <v-row v-if="isDialog" class="ma-0 justify-space-between align-center">
      <v-card-title>{{ selectedDevice.Name }}</v-card-title>
      <v-btn icon class="mr-2" @click="$emit('close-dialog')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
    <v-card-title v-else>{{ selectedDevice.Name }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col>
          <v-row class="my-0">
            <v-col cols="5" class="py-0">
              <span>{{ $t('settings.devices.userName') }}</span>
            </v-col>
            <v-col class="py-0">
              <span>{{ selectedDevice.LastUserName }}</span>
            </v-col>
          </v-row>
          <v-row class="my-0">
            <v-col cols="5" class="pt-0 pb-0">
              <span>{{ $t('settings.devices.appName') }}</span>
            </v-col>
            <v-col class="pt-0 pb-0">
              <span>{{ selectedDevice.AppName }}</span>
            </v-col>
          </v-row>
          <v-row class="my-0">
            <v-col cols="5" class="pt-0 pb-0">
              <span>{{ $t('settings.devices.appVersion') }}</span>
            </v-col>
            <v-col class="pt-0 pb-0">
              <span>{{ selectedDevice.AppVersion }}</span>
            </v-col>
          </v-row>
          <v-row class="my-0">
            <v-col cols="5" class="pt-0 pb-0">
              <span>{{ $t('settings.devices.lastActive') }}</span>
            </v-col>
            <v-col class="pt-0 pb-0">
              <span class="text-capitalize-first-letter">
                {{
                  $dateFns.formatRelative(
                    $dateFns.parseJSON(selectedDevice.DateLastActivity),
                    new Date(),
                    {
                      locale: $i18n.locale
                    }
                  )
                }}</span
              >
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-btn color="error" @click="$emit('delete-selected')">
        {{ $t('settings.devices.delete') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { DeviceInfo } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    selectedDevice: {
      type: Object as PropType<DeviceInfo>,
      default: (): DeviceInfo => {
        return {};
      }
    },
    isDialog: {
      default: false,
      type: Boolean
    }
  }
});
</script>

<style lang="scss" scoped>
.selected-device-card {
  width: 40em;
}
</style>
