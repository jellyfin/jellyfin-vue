<template>
  <settings-page page-title="settings.dlna.dlna">
    <template #actions>
      <v-btn
        rel="noreferrer noopener"
        href="https://jellyfin.org/docs/general/networking/dlna.html"
        target="_blank"
      >
        {{ $t('settings.help') }}
      </v-btn>
    </template>
    <template #content>
      <v-col cols="12" md="6" lg="5" class="py-4">
        <v-card class="mb-4">
          <v-list two-line flat>
            <v-list-item-group>
              <v-list-item
                v-for="dlnaSettingName in Object.keys(dlnaSettings)"
                :key="dlnaSettingName"
              >
                <v-list-item-content>
                  <v-list-item-title
                    v-text="$t('settings.dlna.' + dlnaSettingName + '.text')"
                  />
                  <v-list-item-subtitle
                    v-text="
                      $t('settings.dlna.' + dlnaSettingName + '.description')
                    "
                  />
                </v-list-item-content>
                <v-list-item-action>
                  <v-switch
                    v-if="typeof dlnaSettings[dlnaSettingName] === 'boolean'"
                    v-model="dlnaSettings[dlnaSettingName]"
                    @change="storeDlnaConfiguration"
                  />
                  <v-text-field
                    v-if="typeof dlnaSettings[dlnaSettingName] === 'number'"
                    v-model.number="dlnaSettings[dlnaSettingName]"
                    type="number"
                    outlined
                    reverse
                    dense
                    @change="storeDlnaConfiguration"
                  />
                  <v-select
                    v-if="
                      typeof dlnaSettings[dlnaSettingName] === 'string' ||
                      typeof dlnaSettings[dlnaSettingName] === 'undefined'
                    "
                    v-model="dlnaSettings[dlnaSettingName]"
                    :items="users"
                    item-text="Name"
                    item-value="Id"
                    :label="$t('settings.dlna.DefaultUserId.selector')"
                    reverse
                    dense
                    outlined
                    @change="storeDlnaConfiguration"
                  />
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="5" class="py-4">
        <v-card class="mb-4">
          <v-card-title>
            {{ $t('settings.dlna.profile.custom.text') }}
            <v-spacer />
            <v-btn class="ml-a" color="primary">
              {{ $t('settings.dlna.profile.new') }}
            </v-btn>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="userProfiles"
            :items-per-page="4"
            :footer-props="{
              itemsPerPageOptions: [4, 8, 12, 16, -1]
            }"
            @click:row="setSelectedDevice"
          />
        </v-card>
        <v-card class="mb-4">
          <v-card-title>
            {{ $t('settings.dlna.profile.system.text') }}
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="systemProfiles"
            :items-per-page="4"
            :footer-props="{
              itemsPerPageOptions: [4, 8, 12, 16, -1]
            }"
            @click:row="setSelectedDevice"
          />
        </v-card>
      </v-col>
      <v-dialog
        v-model="deviceInfoDialog"
        width="fit-content"
        :retain-focus="false"
      >
        <dlna-profile-editor
          v-if="selectedProfile.Name"
          :selected-profile="selectedProfile"
          :is-custom-profile="isCustomProfile"
          :users="users"
          @close-dialog="closeDialog"
          @save-selected="saveProfile"
          @delete-selected="deleteSelectedProfile"
        />
      </v-dialog>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  DeviceProfile,
  DeviceProfileInfo,
  DeviceProfileType,
  UserDto
} from '@jellyfin/client-axios';
import isNil from 'lodash/isNil';
import { mapStores } from 'pinia';
import { snackbarStore } from '~/store';

/**
 * We need to define those interfaces here as the axios hook for
 * $api.configuration.getNamedConfiguration() returns an
 * any typed object which we cannot use further down the line.
 */
interface DlnaNamedConfiguration {
  EnablePlayTo: boolean;
  EnablePlayToTracing: boolean;
  EnableDebugLog: boolean;
  ClientDiscoveryIntervalSeconds: number;
  EnableServer: boolean;
  AliveMessageIntervalSeconds: number;
  BlastAliveMessages: boolean;
  DefaultUserId: string;
  AutoCreatePlayToProfiles: boolean;
  SendOnlyMatchedHost: boolean;
}

/**
 * FIXME: this is a short term hack in order for it to display all entries
 * needs architectural change.
 */
const identification = {
  Identification: {
    FriendlyName: '',
    ModelNumber: '',
    SerialNumber: '',
    ModelName: '',
    ModelDescription: '',
    ModelUrl: '',
    Manufacturer: '',
    ManufacturerUrl: '',
    Headers: []
  }
};

export default Vue.extend({
  async asyncData({ $api }) {
    const dlnaSettings = (
      await $api.configuration.getNamedConfiguration({ key: 'dlna' })
    ).data;

    // remove deprecated duplicate option
    delete dlnaSettings.BlastAliveMessageIntervalSeconds;

    const dlnaProfiles = (await $api.dlna.getProfileInfos()).data;
    const users = (await $api.user.getUsers()).data;

    return { dlnaSettings, dlnaProfiles, users };
  },
  data() {
    return {
      dlnaSettings: {} as DlnaNamedConfiguration,
      dlnaProfiles: [] as DeviceProfileInfo[],
      users: [] as UserDto[],
      selectedProfile: {} as DeviceProfile,
      deviceInfoDialog: false,
      isCustomProfile: false,
      currentProfileId: ''
    };
  },
  computed: {
    ...mapStores(snackbarStore),
    headers(): { text: string; value: string }[] {
      return [
        {
          text: this.$t('settings.dlna.profile.name'),
          value: 'Name'
        }
      ];
    },
    userProfiles(): DeviceProfileInfo[] {
      return this.dlnaProfiles.filter(
        (profile) => profile.Type === DeviceProfileType.User
      );
    },
    systemProfiles(): DeviceProfileInfo[] {
      return this.dlnaProfiles.filter(
        (profile) => profile.Type === DeviceProfileType.System
      );
    }
  },
  methods: {
    async storeDlnaConfiguration(): Promise<void> {
      await this.$api.configuration
        .updateNamedConfiguration(
          {
            key: 'dlna'
          },
          { data: this.dlnaSettings }
        )
        .then(() =>
          this.snackbar.push(this.$t('settings.dlna.savedSuccess'), 'success')
        )
        .catch(() =>
          this.snackbar.push(this.$t('settings.dlna.savedError'), 'error')
        );
    },
    async setSelectedDevice(selectedDevice: DeviceProfileInfo): Promise<void> {
      if (!isNil(selectedDevice)) {
        this.currentProfileId = selectedDevice.Id as string;
        this.selectedProfile = (
          await this.$api.dlna.getProfile({
            profileId: selectedDevice.Id as string
          })
        ).data;
        this.selectedProfile = {
          ...selectedDevice,
          ...identification
        };
        this.isCustomProfile = this.userProfiles.includes(selectedDevice);
        this.deviceInfoDialog = true;
      }
    },
    async saveProfile(profile: DeviceProfile): Promise<void> {
      await this.$api.dlna
        .updateProfile({
          profileId: this.currentProfileId,
          deviceProfile: profile
        })
        .then(() =>
          this.snackbar.push(
            this.$t('settings.dlna.savedProfileSuccess'),
            'success'
          )
        )
        .catch(() =>
          this.snackbar.push(
            this.$t('settings.dlna.savedProfileError'),
            'error'
          )
        );
      this.dlnaProfiles = (await this.$api.dlna.getProfileInfos()).data;
      this.closeDialog();
    },
    async deleteSelectedProfile(): Promise<void> {
      await this.$api.dlna
        .deleteProfile({
          profileId: this.currentProfileId
        })
        .then(() =>
          this.snackbar.push(this.$t('settings.dlna.deleteSuccess'), 'success')
        )
        .catch(() =>
          this.snackbar.push(this.$t('settings.dlna.deleteError'), 'error')
        );
      this.dlnaProfiles = (await this.$api.dlna.getProfileInfos()).data;
      this.closeDialog();
    },
    closeDialog(): void {
      this.deviceInfoDialog = false;
      this.isCustomProfile = false;
      this.selectedProfile = {};
    }
  }
});
</script>
