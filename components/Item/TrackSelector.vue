<template>
  <v-select
    v-model="trackIndex"
    outlined
    filled
    flat
    dense
    single-line
    hide-details
    class="text-truncate"
    :items="selectItems"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
  >
    <template slot="selection" slot-scope="{ item: i }">
      {{ getTrackSelection(i.text) }}
    </template>

    <template slot="item" slot-scope="{ item: i, on, attrs }">
      <v-list-item
        v-bind="attrs"
        :two-line="!!getTrackSubtitle(i.text)"
        v-on="on"
      >
        <v-list-item-avatar v-if="getTrackIcon(i.text)">
          <v-icon>{{ getTrackIcon(i.text) }}</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ getTrackTitle(i.text) }}</v-list-item-title>
          <v-list-item-subtitle v-if="getTrackSubtitle(i.text)">
            {{ getTrackSubtitle(i.text) }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-select>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Temporary module while waiting for fixes to language names on the server
// @ts-ignore
import langs from 'langs';
import {
  BaseItemDto,
  MediaStream,
  MediaSourceInfo
} from '@jellyfin/client-axios';
import formsHelper from '~/mixins/formsHelper';

export default Vue.extend({
  mixins: [formsHelper],
  props: {
    item: {
      type: Object as PropType<BaseItemDto>,
      required: true
    },
    mediaSourceIndex: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      required: true,
      validator(value: string): boolean {
        return ['Audio', 'Subtitle', 'Video'].includes(value);
      }
    }
  },
  data() {
    return { trackIndex: undefined as number | undefined };
  },
  computed: {
    mediaSourceItem: {
      get(): MediaSourceInfo {
        return this.item.MediaSources
          ? this.item.MediaSources[this.mediaSourceIndex]
          : {};
      }
    },
    tracks: {
      get(): MediaStream[] {
        if (!this.mediaSourceItem.MediaStreams) return [];
        return this.mediaSourceItem.MediaStreams.filter(
          (mediaStream) => mediaStream.Type === this.type
        );
      }
    },
    selectItems: {
      get(): { text: MediaStream; value: number }[] {
        return this.tracks.map((value, idx) => {
          return { text: value, value: idx };
        });
      }
    },
    disabled: {
      get(): boolean {
        if (this.tracks.length <= 0) return true;
        if (this.type !== 'Subtitle' && this.tracks.length <= 1) return true;
        return false;
      }
    },
    placeholder: {
      get(): string {
        if (this.type === 'Audio' && this.tracks.length === 0)
          return this.$t('noAudioAvailable');
        if (this.type === 'Audio' && this.tracks.length !== 0)
          return this.$t('noAudioSelected');
        if (this.type === 'Subtitle' && this.tracks.length === 0)
          return this.$t('noSubtitleAvailable');
        if (this.type === 'Subtitle' && this.tracks.length !== 0)
          return this.$t('noSubtitleSelected');
        if (this.type === 'Video' && this.tracks.length === 0)
          return this.$t('noVideoAvailable');
        if (this.type === 'Video' && this.tracks.length !== 0)
          return this.$t('noVideoSelected');
        return this.$t('noTrackAvailable');
      }
    },
    clearable: {
      get(): boolean {
        return this.type === 'Subtitle';
      }
    },
    defaultIndex: {
      get(): number | undefined {
        const defaultTrack = this.tracks.findIndex((track) => track.IsDefault);
        if (defaultTrack !== -1) return defaultTrack;
        else if (this.type === 'Subtitle') return undefined;
        return 0;
      }
    }
  },
  watch: {
    trackIndex(newVal: number): void {
      this.$emit('input', newVal);
    },
    mediaSourceIndex(): void {
      this.resetDefaultTrack();
    }
  },
  beforeMount() {
    this.resetDefaultTrack();
  },
  methods: {
    resetDefaultTrack(): void {
      this.trackIndex = this.defaultIndex;
    },
    getTrackSelection(track: MediaStream): string {
      if (track.DisplayTitle) return track.DisplayTitle;
      return '';
    },
    getTrackIcon(track: MediaStream): string | null | undefined {
      if (this.type === 'Audio' && track.ChannelLayout)
        return this.getSurroundIcon(track.ChannelLayout);
      return '';
    },
    getTrackTitle(track: MediaStream): string {
      if (track.DisplayTitle) return track.DisplayTitle;
      return '';
    },
    getTrackSubtitle(track: MediaStream): string {
      if ((this.type === 'Audio' || this.type === 'Subtitle') && track.Language)
        return this.getLanguageName(track.Language);
      else if (this.type === 'Audio' || this.type === 'Subtitle')
        return this.$t('undefined');

      return '';
    },
    getLanguageName(code: string): string {
      return langs.where('2B', code).name;
    },
    getSurroundIcon(layout: string): string {
      switch (layout) {
        case '2.0':
          return 'mdi-surround-sound-2-0';
        case '3.1':
          return 'mdi-surround-sound-3-1';
        case '5.1':
          return 'mdi-surround-sound-5-1';
        case '7.1':
          return 'mdi-surround-sound-7-1';
        default:
          return 'mdi-surround-sound';
      }
    }
  }
});
</script>
