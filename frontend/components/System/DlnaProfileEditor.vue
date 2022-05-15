<template>
  <v-card class="dlnaProfileEditor">
    <v-row class="ma-0 justify-space-between align-center">
      <v-card-title>{{ selectedProfile.Name }}</v-card-title>
      <v-btn icon class="mr-2" @click="$emit('close-dialog')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
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
                {{ $t('settings.dlna.profile.info.general') }}
              </v-list-item-title>
            </template>
            <v-list-item
              v-for="key in Object.keys(profileInformation)"
              :key="key"
            >
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.' + key + '.text')"
                />
                <v-list-item-subtitle
                  v-text="$t('settings.dlna.profile.info.' + key + '.info')"
                />
              </v-list-item-content>
              <v-list-item-action>
                <v-select
                  v-if="key === 'UserId'"
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
                <v-text-field
                  v-else-if="typeof currentProfile[key] === 'string'"
                  v-model="currentProfile[key]"
                  outlined
                  dense
                />
                <v-text-field
                  v-else
                  v-model.number="currentProfile.MaxStreamingBitrate"
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
                {{ $t('settings.dlna.profile.info.mediaTypes.text') }}
              </v-list-item-title>
            </template>
            <v-list-item v-for="key in Object.keys(mediaTypes)" :key="key">
              <v-list-item-action>
                <v-checkbox v-model="supportedMediaTypes" :value="key" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title
                  v-text="$t('settings.dlna.profile.info.mediaTypes.' + key)"
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
        v-for="section in tableCategories"
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
              <v-btn class="ml-a" color="primary" @click="newItem(section)">
                {{ $t('settings.dlna.newEntry') }}
              </v-btn>
              <v-dialog
                v-model="entryEditor"
                width="fit-content"
                :retain-focus="false"
              >
                <dlna-entry-editor
                  v-if="editEntry !== undefined"
                  :entry-data="editEntry"
                  :category="currentCategory"
                  @close-editor="closeEditor"
                  @save-item="saveItem"
                />
              </v-dialog>
            </v-toolbar>
          </template>
          <template #item.Conditions="{ item }">
            {{ JSON.stringify(item.Conditions) }}
          </template>
          <template #item.action="{ item }">
            <v-icon small class="mr-2" @click="editItem(section, item)">
              mdi-pencil
            </v-icon>
            <v-icon small class="mr-2" @click="deleteItem(section, item)">
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
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
  CodecProfile,
  ContainerProfile,
  DeviceProfile,
  DirectPlayProfile,
  DlnaProfileType,
  SubtitleProfile,
  TranscodeSeekInfo,
  TranscodingProfile,
  UserDto,
  XmlAttribute
} from '@jellyfin/client-axios';
import { SubtitleDeliveryMethod } from '@jellyfin/client-axios/dist/models/subtitle-delivery-method';
import { EncodingContext } from '@jellyfin/client-axios/dist/models/encoding-context';
import { CodecType } from '@jellyfin/client-axios/dist/models/codec-type';

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

enum TableCategories {
  SubtitleProfiles = 'SubtitleProfiles',
  DirectPlayProfiles = 'DirectPlayProfiles',
  TranscodingProfiles = 'TranscodingProfiles',
  ContainerProfiles = 'ContainerProfiles',
  CodecProfiles = 'CodecProfiles',
  ResponseProfiles = 'ResponseProfiles',
  XmlRootAttributes = 'XmlRootAttributes'
}

enum ProfileInfo {
  Name = 'Name',
  UserId = 'UserId',
  MaxStreamingBitrate = 'MaxStreamingBitrate',
  MusicStreamingTranscodingBitrate = 'MusicStreamingTranscodingBitrate'
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

type TableUnion =
  | SubtitleProfile
  | DirectPlayProfile
  | TranscodingProfile
  | CodecProfile
  | ContainerProfile
  | XmlAttribute;

interface HeaderType {
  text: string;
  value: string;
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
    }
  },
  data() {
    return {
      entryEditor: false,
      mediaTypes: DlnaProfileType,
      profileInformation: ProfileInfo,
      tableCategories: TableCategories,
      serverIdentification: ServerIdentification,
      categories: DlnaProfileCategories,
      displaySettings: DisplaySettings,
      imageSettings: ImageSettings,
      tab: null,
      originalItem: {} as TableUnion | undefined,
      editEntry: {} as TableUnion | undefined,
      currentCategory: '',
      emptyProfiles: {
        SubtitleProfiles: {
          Format: '',
          Method: SubtitleDeliveryMethod.External,
          DidlMode: '',
          Language: '',
          Container: ''
        },
        DirectPlayProfiles: {
          Container: '',
          AudioCodec: '',
          VideoCodec: '',
          Type: DlnaProfileType.Audio
        },
        TranscodingProfiles: {
          Container: '',
          Type: DlnaProfileType.Audio,
          VideoCodec: '',
          AudioCodec: '',
          Protocol: '',
          EstimateContentLength: false,
          EnableMpegtsM2TsMode: false,
          TranscodeSeekInfo: TranscodeSeekInfo.Auto,
          CopyTimestamps: false,
          Context: EncodingContext.Static,
          EnableSubtitlesInManifest: false,
          MaxAudioChannels: '',
          MinSegments: 0,
          SegmentLength: 0,
          BreakOnNonKeyFrames: false
        },
        ContainerProfiles: {
          Type: DlnaProfileType.Audio,
          Conditions: [],
          Container: ''
        },
        CodecProfiles: {
          Type: CodecType.Audio,
          Conditions: [],
          ApplyConditions: [],
          Codec: '',
          Container: ''
        },
        ResponseProfiles: {
          Container: '',
          AudioCodec: '',
          VideoCodec: '',
          Type: DlnaProfileType.Audio,
          OrgPn: '',
          MimeType: '',
          Conditions: []
        },
        XmlRootAttributes: {
          Name: '',
          Value: ''
        }
      } as Record<string, TableUnion>,
      currentProfile: undefined as DeviceProfile | undefined,
      supportedMediaTypes: [] as Array<string> | undefined
    };
  },
  computed: {
    headers(): Record<string, Array<HeaderType>> {
      const record: Record<string, Array<HeaderType>> = {};

      Object.entries(this.emptyProfiles).forEach(([key, value]) => {
        const temp: Array<HeaderType> = [];

        for (const entry in value) {
          temp.push({
            text: this.$t('settings.dlna.table.' + entry),
            value: entry
          });
        }

        temp.push({
          text: this.$t('settings.dlna.table.action'),
          value: 'action'
        });

        record[key] = temp;
      });

      return record;
    }
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
    },
    newItem(key: TableCategories) {
      this.originalItem = undefined;
      this.editEntry = this.emptyProfiles[key];
      this.currentCategory = key;
      this.entryEditor = true;
    },
    editItem(key: TableCategories, item: TableUnion) {
      this.originalItem = item;
      this.editEntry = {
        ...this.emptyProfiles[key],
        ...item
      };
      this.currentCategory = key;
      this.entryEditor = true;
    },
    closeEditor() {
      this.originalItem = undefined;
      this.editEntry = undefined;
      this.currentCategory = '';
      this.entryEditor = false;
    },
    saveItem(item: TableUnion) {
      if (!this.currentProfile) {
        return;
      }

      const tab = this.currentProfile[
        this.currentCategory as keyof DeviceProfile
      ] as Array<TableUnion>;

      if (this.originalItem === undefined) {
        tab.push(item);
      } else {
        tab.splice(tab.indexOf(this.originalItem), 1, item);
      }

      this.closeEditor();
    },
    deleteItem(key: TableCategories, item: TableUnion) {
      if (!this.currentProfile) {
        return;
      }

      const tab = this.currentProfile[
        key as keyof DeviceProfile
      ] as Array<TableUnion>;

      tab.splice(tab.indexOf(item), 1);
    }
  }
});
</script>

<style lang="scss" scoped>
.dlnaProfileEditor {
  width: 80em;
}
</style>
