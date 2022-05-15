<template>
  <v-card class="dlnaEntryEditor">
    <v-row class="ma-0 justify-space-between align-center">
      <v-card-title>{{ $t('settings.dlna.entryEditor') }}</v-card-title>
      <v-btn icon class="mr-2" @click="$emit('close-editor')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col
            v-for="key in Object.keys(currentEntryData)"
            :key="key"
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-if="key === 'Method'"
              v-model="currentEntryData[key]"
              :items="Object.values(deliveryMethod)"
              outlined
              :label="$t('settings.dlna.table.' + key)"
            />
            <v-select
              v-else-if="key === 'Type' && category === 'CodecProfiles'"
              v-model="currentEntryData[key]"
              :items="Object.values(codecType)"
              outlined
              :label="$t('settings.dlna.table.' + key)"
            />
            <v-select
              v-else-if="key === 'Type'"
              v-model="currentEntryData[key]"
              :items="Object.values(dlnaMediaType)"
              outlined
              :label="$t('settings.dlna.table.' + key)"
            />
            <v-select
              v-else-if="key === 'TranscodeSeekInfo'"
              v-model="currentEntryData[key]"
              :items="Object.values(transcodeSeekInfo)"
              outlined
              :label="$t('settings.dlna.table.' + key)"
            />
            <v-select
              v-else-if="key === 'Context'"
              v-model="currentEntryData[key]"
              :items="Object.values(encodingContext)"
              outlined
              :label="$t('settings.dlna.table.' + key)"
            />
            <v-text-field
              v-else-if="typeof currentEntryData[key] === 'string'"
              v-model="currentEntryData[key]"
              :label="$t('settings.dlna.table.' + key)"
              outlined
            />
            <v-text-field
              v-else-if="typeof currentEntryData[key] === 'number'"
              v-model.number="currentEntryData[key]"
              :label="$t('settings.dlna.table.' + key)"
              type="number"
              outlined
            />
            <v-checkbox
              v-else-if="typeof currentEntryData[key] === 'boolean'"
              v-model="currentEntryData[key]"
              :label="$t('settings.dlna.table.' + key)"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-btn color="success" @click="$emit('save-item', currentEntryData)">
        {{ $t('settings.dlna.profile.save') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  CodecProfile,
  ContainerProfile,
  DirectPlayProfile,
  DlnaProfileType,
  ResponseProfile,
  SubtitleDeliveryMethod,
  SubtitleProfile,
  TranscodeSeekInfo,
  TranscodingProfile,
  XmlAttribute
} from '@jellyfin/client-axios';
import { CodecType } from '@jellyfin/client-axios/dist/models/codec-type';
import { EncodingContext } from '@jellyfin/client-axios/dist/models/encoding-context';

export default Vue.extend({
  props: {
    entryData: {
      type: Object as () =>
        | SubtitleProfile
        | DirectPlayProfile
        | TranscodingProfile
        | ContainerProfile
        | CodecProfile
        | ResponseProfile
        | XmlAttribute,
      default: () => {
        return {};
      }
    },
    category: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      currentEntryData: undefined as
        | SubtitleProfile
        | DirectPlayProfile
        | TranscodingProfile
        | ContainerProfile
        | CodecProfile
        | ResponseProfile
        | XmlAttribute
        | undefined,
      deliveryMethod: SubtitleDeliveryMethod,
      codecType: CodecType,
      dlnaMediaType: DlnaProfileType,
      transcodeSeekInfo: TranscodeSeekInfo,
      encodingContext: EncodingContext
    };
  },
  beforeMount() {
    this.bindToData();
  },
  methods: {
    bindToData() {
      this.currentEntryData = JSON.parse(JSON.stringify(this.entryData));
    }
  }
});
</script>

<style lang="scss" scoped>
.dlnaEntryEditor {
  width: 80em;
}
</style>
