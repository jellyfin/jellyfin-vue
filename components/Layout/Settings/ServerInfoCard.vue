<template>
  <v-col>
    <v-fade-transition appear>
      <v-card-text v-if="!isEmpty(systemInfo)">
        <v-row>
          <v-col>
            <v-row>
              <v-col cols="5">
                <span class="text-uppercase font-weight-medium">
                  {{ $t('server') }}
                </span>
              </v-col>
              <v-col class="d-flex align-self-center">
                <span>{{ systemInfo.ServerName }}</span>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <span class="text-uppercase font-weight-medium">
                  {{ $t('serverVersion') }}
                </span>
              </v-col>
              <v-col class="d-flex align-self-center">
                <span>{{ systemInfo.Version }}</span>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <span class="text-uppercase font-weight-medium">
                  {{ $t('operatingSystem') }}
                </span>
              </v-col>
              <v-col class="d-flex align-self-center">
                <span>{{ systemInfo.OperatingSystemDisplayName }}</span>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <span class="text-uppercase font-weight-medium">
                  {{ $t('architecture') }}
                </span>
              </v-col>
              <v-col class="d-flex align-self-center">
                <span>{{ systemInfo.SystemArchitecture }}</span>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="5">
                <span class="text-uppercase font-weight-medium">
                  {{ $t('vueClientVersion') }}
                </span>
              </v-col>
              <v-col class="d-flex align-self-center">
                <span>{{ vueVersion }}</span>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="3" class="d-flex justify-end">
            <v-img
              contain
              src="/icon.png"
              width="100%"
              :alt="$t('jellyfinLogo')"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-fade-transition>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { isEmpty } from 'lodash';
import { SystemInfo } from '@jellyfin/client-axios';
import { version } from '~/package.json';

export default Vue.extend({
  data() {
    return {
      systemInfo: {} as SystemInfo,
      vueVersion: version
    };
  },
  async fetch() {
    this.systemInfo = (await this.$api.system.getSystemInfo()).data;
  },
  methods: {
    isEmpty(object: never): boolean {
      return isEmpty(object);
    }
  }
});
</script>
