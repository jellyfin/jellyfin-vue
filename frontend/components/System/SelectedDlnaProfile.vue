<template>
  <v-card class="selected-dlna-profile">
    <v-row v-if="isDialog" class="ma-0 justify-space-between align-center">
      <v-card-title>{{ selectedProfile.Name }}</v-card-title>
      <v-btn icon class="mr-2" @click="$emit('close-dialog')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
    <v-card-title v-else>{{ currentProfile.Name }}</v-card-title>
    <v-tabs v-model="tab" centered dark icons-and-text>
      <v-tabs-slider />
      <v-tab v-for="i in 9" :key="i" :href="'#tab-' + i">
        {{
          $t(
            'settings.dlna.profile.' +
              categories[i - 1].toLocaleString() +
              '.title'
          )
        }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item value="tab-1">
        <v-list>
          <!-- General -->
          <v-list-group :value="true">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.info.general.title') }}
              </v-list-item-title>
            </template>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.general.name.text')"
                />
                <v-list-item-subtitle
                  v-text="$t('settings.dlna.profile.info.general.name.info')"
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field v-model="currentProfile.Name" outlined dense />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.general.userLibrary.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.general.userLibrary.info')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-select
                  v-model="currentProfile.UserId"
                  :items="users"
                  item-text="Name"
                  item-value="Id"
                  outlined
                  dense
                  clearable
                  :label="$t('settings.dlna.DefaultUserId.selector')"
                  reverse
                />
              </v-list-item-action>
            </v-list-item>
            <!-- Supported Media Types -->
            <v-list-group :value="true" no-action sub-group>
              <template #activator>
                <v-list-item-title>
                  {{ $t('settings.dlna.profile.info.general.mediaTypes.text') }}
                </v-list-item-title>
              </template>
              <v-list-item>
                <v-list-item-action>
                  <v-checkbox v-model="supportedMediaTypes" value="Audio" />
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title
                    v-text="
                      $t('settings.dlna.profile.info.general.mediaTypes.audio')
                    "
                  />
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-action>
                  <v-checkbox v-model="supportedMediaTypes" value="Photo" />
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title
                    v-text="
                      $t('settings.dlna.profile.info.general.mediaTypes.photo')
                    "
                  />
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-action>
                  <v-checkbox v-model="supportedMediaTypes" value="Video" />
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title
                    v-text="
                      $t('settings.dlna.profile.info.general.mediaTypes.video')
                    "
                  />
                </v-list-item-content>
              </v-list-item>
            </v-list-group>
            <!-- back to normal -->
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.info.general.maxStreamQuality.text'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t(
                      'settings.dlna.profile.info.general.maxStreamQuality.info'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model.number="currentProfile.MaxStreamingBitrate"
                  type="number"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.info.general.musicTranscodeQuality.text'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t(
                      'settings.dlna.profile.info.general.musicTranscodeQuality.info'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model.number="
                    currentProfile.MusicStreamingTranscodingBitrate
                  "
                  type="number"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>

          <!-- Display -->
          <v-list-group :value="false">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.info.display.title') }}
              </v-list-item-title>
            </template>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox v-model="currentProfile.RequiresPlainFolders" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.display.plainFolder.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.display.plainFolder.info')
                  "
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox v-model="currentProfile.RequiresPlainVideoItems" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.display.plainVideo.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.display.plainVideo.info')
                  "
                />
              </v-list-item-content>
            </v-list-item>
          </v-list-group>

          <!-- Image Settings -->
          <v-list-group :value="false">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.info.image.title') }}
              </v-list-item-title>
            </template>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox v-model="currentProfile.EnableAlbumArtInDidl" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.image.embedDidl.text')"
                />
                <v-list-item-subtitle
                  v-text="$t('settings.dlna.profile.info.image.embedDidl.info')"
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox
                  v-model="currentProfile.EnableSingleAlbumArtLimit"
                />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.image.singleEmbed.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.singleEmbed.info')
                  "
                />
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.image.albumPN.text')"
                />
                <v-list-item-subtitle
                  v-text="$t('settings.dlna.profile.info.image.albumPN.info')"
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.AlbumArtPn"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.image.albumArtMaxWidth')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.albumMaxDimension')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.MaxAlbumArtWidth"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.image.albumArtMaxHeight')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.albumMaxDimension')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.MaxAlbumArtHeight"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.image.iconMaxWidth')"
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.iconMaxDimension')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.MaxIconWidth"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.image.iconMaxHeight')"
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.iconMaxDimension')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.MaxIconHeight"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-tab-item>

      <v-tab-item value="tab-2">
        <v-list>
          <!-- Identification -->
          <v-list-group :value="true">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.identification.device.title') }}
              </v-list-item-title>
            </template>
            <v-card-text>
              {{ $t('settings.dlna.profile.identification.device.info') }}
            </v-card-text>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.friendlyName'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.FriendlyName"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.manufacturer'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.Manufacturer"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.manufacturerUrl'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ManufacturerUrl"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.identification.device.modelName')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ModelName"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.modelNumber'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ModelNumber"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.modelDescription'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ModelDescription"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.identification.device.modelUrl')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ModelUrl"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.serialNumber'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.SerialNumber"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.device.deviceDescription'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification.ModelDescription"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>

          <!-- Server Settings -->
          <v-list-group :value="false">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.identification.server.title') }}
              </v-list-item-title>
            </template>
            <v-card-text>
              {{ $t('settings.dlna.profile.identification.server.info') }}
            </v-card-text>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.friendlyName'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.FriendlyName"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.manufacturer'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Manufacturer"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.manufacturerUrl'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ManufacturerUrl"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.identification.server.modelName')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ModelName"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.modelNumber'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ModelNumber"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.modelDescription'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ModelDescription"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.identification.server.modelUrl')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ModelUrl"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.serialNumber'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.SerialNumber"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.protocolInfo.text'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.protocolInfo.info'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.ProtocolInfo"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.sonyAggregationFlags.text'
                    )
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t(
                      'settings.dlna.profile.identification.server.sonyAggregationFlags.info'
                    )
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.SonyAggregationFlags"
                  outlined
                  dense
                />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-tab-item>

      <v-tab-item value="tab-3">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.subtitle.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-4">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.directPlay.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-5">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.transcoding.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-6">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.containers.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-7">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.codecs.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-8">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.responses.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item value="tab-9">
        <v-card>
          <v-card-text>
            {{ $t('settings.dlna.profile.xml.text') }}
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-card-actions>
      <v-btn color="success" @click="$emit('save-selected', currentProfile)">
        {{
          isCustomProfile
            ? $t('settings.dlna.profile.save')
            : $t('settings.dlna.profile.saveNew')
        }}
      </v-btn>
      <v-btn
        v-if="isCustomProfile"
        color="error"
        @click="$emit('delete-selected')"
      >
        {{ $t('settings.devices.delete') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { DeviceProfile, UserDto } from '@jellyfin/client-axios';

enum DlnaProfileCategories {
  info,
  identification,
  subtitle,
  directPlay,
  transcoding,
  containers,
  codecs,
  responses,
  xml
}

export default Vue.extend({
  props: {
    selectedProfile: {
      type: Object as () => DeviceProfile,
      default: (): DeviceProfile => {
        return {};
      }
    },
    isCustomProfile: {
      default: false,
      type: Boolean
    },
    users: {
      type: Array as () => UserDto[],
      default: () => undefined
    },
    isDialog: {
      default: false,
      type: Boolean
    }
  },
  data() {
    return {
      categories: DlnaProfileCategories,
      tab: null,
      currentProfile: undefined as DeviceProfile | undefined,
      supportedMediaTypes: [] as Array<string> | undefined
    };
  },
  watch: {
    supportedMediaTypes() {
      if (this.currentProfile) {
        this.currentProfile.SupportedMediaTypes =
          this.supportedMediaTypes?.join(',');
      }
    }
  },
  beforeMount() {
    this.bindToData();
  },
  methods: {
    bindToData() {
      const tempProfile = JSON.parse(JSON.stringify(this.selectedProfile));

      this.currentProfile = tempProfile;
      this.supportedMediaTypes =
        tempProfile.SupportedMediaTypes?.split(',') || [];
    }
  }
});
</script>

<style lang="scss" scoped>
.selected-dlna-profile {
  width: 80em;
}
</style>
