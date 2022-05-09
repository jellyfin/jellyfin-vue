<template>
  <v-card class="dlnaProfileEditor">
    <v-row v-if="isDialog" class="ma-0 justify-space-between align-center">
      <v-card-title>{{ selectedProfile.Name }}</v-card-title>
      <v-btn icon class="mr-2" @click="$emit('close-dialog')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
    <v-card-title v-else>{{ currentProfile.Name }}</v-card-title>
    <v-tabs v-model="tab" centered dark icons-and-text>
      <v-tabs-slider />
      <v-tab v-for="i in categories" :key="i" :href="'#tab-' + i">
        {{ $t('settings.dlna.profile.' + i + '.title') }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item value="tab-info">
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

          <!-- Supported Media Types -->
          <v-list-group :value="false">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.info.general.mediaTypes.text') }}
              </v-list-item-title>
            </template>
            <v-list-item v-for="key in Object.keys(mediaTypes)" :key="key">
              <v-list-item-action>
                <v-checkbox v-model="supportedMediaTypes" :value="key" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.general.mediaTypes.' + key)
                  "
                />
              </v-list-item-content>
            </v-list-item>
          </v-list-group>

          <!-- Display -->
          <v-list-group :value="false">
            <template #activator>
              <v-list-item-title>
                {{ $t('settings.dlna.profile.info.display.title') }}
              </v-list-item-title>
            </template>
            <v-list-item v-for="key in Object.keys(displaySettings)" :key="key">
              <v-list-item-action>
                <v-checkbox v-model="currentProfile[key]" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.display.' + key + '.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.display.' + key + '.info')
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
            <v-list-item v-for="key in Object.keys(imageSettings)" :key="key">
              <v-list-item-action
                v-if="typeof currentProfile[key] === 'boolean'"
              >
                <v-checkbox v-model="currentProfile[key]" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="
                    $t('settings.dlna.profile.info.image.' + key + '.text')
                  "
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.info.image.' + key + '.info')
                  "
                />
              </v-list-item-content>
              <v-list-item-action
                v-if="typeof currentProfile[key] !== 'boolean'"
              >
                <v-text-field v-model="currentProfile[key]" outlined dense />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-tab-item>

      <v-tab-item value="tab-identification">
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
            <v-list-item
              v-for="key in Object.keys(currentProfile.Identification)"
              :key="key"
            >
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.identification.' + key)"
                />
                <v-list-item-subtitle
                  v-text="
                    $t('settings.dlna.profile.identification.device.infoText')
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model="currentProfile.Identification[key]"
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
            <v-list-item
              v-for="key in Object.keys(serverIdentification)"
              :key="key"
            >
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.identification.' + key)"
                />
                <v-list-item-subtitle
                  v-if="
                    key === 'ProtocolInfo' || key === 'SonyAggregationFlags'
                  "
                  v-text="
                    $t('settings.dlna.profile.identification.extra.' + key)
                  "
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field v-model="currentProfile[key]" outlined dense />
              </v-list-item-action>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-tab-item>

      <v-tab-item
        v-for="section in [
          'SubtitleProfiles',
          'DirectPlayProfiles',
          'TranscodingProfiles',
          'ContainerProfiles',
          'CodecProfiles',
          'ResponseProfiles',
          'XmlRootAttributes'
        ]"
        :key="section"
        :value="'tab-' + section"
      >
        <v-data-table
          :headers="headers[section]"
          :items="currentProfile[section]"
        >
          <template #top>
            <v-toolbar flat color="secondary">
              <v-toolbar-title>
                {{ $t('settings.dlna.profile.' + section + '.text') }}
              </v-toolbar-title>
              <v-spacer />
            </v-toolbar>
          </template>
        </v-data-table>
      </v-tab-item>

      <v-tab-item value="tab-xml">
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
import {
  DeviceProfile,
  DlnaProfileType,
  UserDto
} from '@jellyfin/client-axios';

enum DlnaProfileCategories {
  info = 'info',
  identification = 'identification',
  subtitle = 'SubtitleProfiles',
  directPlay = 'DirectPlayProfiles',
  transcoding = 'TranscodingProfiles',
  containers = 'ContainerProfiles',
  codecs = 'CodecProfiles',
  responses = 'ResponseProfiles',
  xml = 'XmlRootAttributes'
}

enum ServerIdentification {
  FriendlyName = 'FriendlyName',
  Manufacturer = 'Manufacturer',
  ManufacturerUrl = 'ManufacturerUrl',
  ModelName = 'ModelName',
  ModelNumber = 'ModelNumber',
  ModelDescription = 'ModelDescription',
  ModelUrl = 'ModelUrl',
  SerialNumber = 'SerialNumber',
  ProtocolInfo = 'ProtocolInfo',
  SonyAggregationFlags = 'SonyAggregationFlags'
}

enum DisplaySettings {
  RequiresPlainFolders = 'RequiresPlainFolders',
  RequiresPlainVideoItems = 'RequiresPlainVideoItems'
}

enum ImageSettings {
  EnableAlbumArtInDidl = 'EnableAlbumArtInDidl',
  EnableSingleAlbumArtLimit = 'EnableSingleAlbumArtLimit',
  AlbumArtPn = 'AlbumArtPn',
  MaxAlbumArtWidth = 'MaxAlbumArtWidth',
  MaxAlbumArtHeight = 'MaxAlbumArtHeight',
  MaxIconWidth = 'MaxIconWidth',
  MaxIconHeight = 'MaxIconHeight'
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
      headers: {
        SubtitleProfiles: [
          {
            text: 'Format',
            value: 'Format'
          },
          {
            text: 'Method',
            value: 'Method'
          },
          {
            text: 'DidlMode',
            value: 'DidlMode'
          },
          {
            text: 'Language',
            value: 'Language'
          },
          {
            text: 'Container',
            value: 'Container'
          }
        ],
        DirectPlayProfiles: [
          {
            text: 'Container',
            value: 'Container'
          },
          {
            text: 'AudioCodec',
            value: 'AudioCodec'
          },
          {
            text: 'VideoCodec',
            value: 'VideoCodec'
          },
          {
            text: 'Type',
            value: 'Type'
          }
        ],
        TranscodingProfiles: [
          {
            text: 'Container',
            value: 'Container'
          },
          {
            text: 'Type',
            value: 'Type'
          },
          {
            text: 'AudioCodec',
            value: 'AudioCodec'
          },
          {
            text: 'VideoCodec',
            value: 'VideoCodec'
          },
          {
            text: 'Protocol',
            value: 'Protocol'
          },
          {
            text: 'EstimateContentLength',
            value: 'EstimateContentLength'
          },
          {
            text: 'EnableMpegtsM2TsMode',
            value: 'EnableMpegtsM2TsMode'
          },
          {
            text: 'TranscodeSeekInfo',
            value: 'TranscodeSeekInfo'
          },
          {
            text: 'CopyTimeStamps',
            value: 'CopyTimeStamps'
          },
          {
            text: 'Context',
            value: 'Context'
          },
          {
            text: 'EnableSubtitleInManifest',
            value: 'EnableSubtitleInManifest'
          },
          {
            text: 'MaxAudioChannels',
            value: 'MaxAudioChannels'
          },
          {
            text: 'MinSegments',
            value: 'MinSegments'
          },
          {
            text: 'SegmentLength',
            value: 'SegmentLength'
          },
          {
            text: 'BreakOnNonKeyFrames',
            value: 'BreakOnNonKeyFrames'
          }
        ],
        ContainerProfiles: [
          {
            text: 'Type',
            value: 'Type'
          },
          {
            text: 'Condition',
            value: 'Condition'
          },
          {
            text: 'Container',
            value: 'Container'
          }
        ],
        CodecProfiles: [
          {
            text: 'Type',
            value: 'Type'
          },
          {
            text: 'Condition',
            value: 'Condition'
          },
          {
            text: 'Container',
            value: 'Container'
          }
        ],
        ResponseProfiles: [
          {
            text: 'Container',
            value: 'Container'
          },
          {
            text: 'AudioCodec',
            value: 'AudioCodec'
          },
          {
            text: 'VideoCodec',
            value: 'VideoCodec'
          },
          {
            text: 'Type',
            value: 'Type'
          },
          {
            text: 'OrgPn',
            value: 'OrgPn'
          },
          {
            text: 'MimeType',
            value: 'MimeType'
          },
          {
            text: 'Conditions',
            value: 'Conditions'
          }
        ],
        XmlRootAttributes: [
          {
            text: 'Name',
            value: 'Name'
          },
          {
            text: 'Value',
            value: 'Value'
          }
        ]
      },
      mediaTypes: DlnaProfileType,
      serverIdentification: ServerIdentification,
      categories: DlnaProfileCategories,
      displaySettings: DisplaySettings,
      imageSettings: ImageSettings,
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
.dlnaProfileEditor {
  width: 80em;
}
</style>
