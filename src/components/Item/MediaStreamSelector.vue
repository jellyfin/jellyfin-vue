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
// @ts-expect-error - This module doesn't have typings. Temporary module while waiting for fixes to language names on the server
import langs from 'langs';
import {
  BaseItemDto,
  MediaStream,
  MediaSourceInfo
} from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    /**
     * Media item
     */
    item: {
      type: Object as PropType<BaseItemDto>,
      required: true
    },
    /**
     * Current media source used (current movie version for instance)
     */
    mediaSourceIndex: {
      type: Number,
      default: 0
    },
    /**
     * Which media type to consider for this selector
     */
    type: {
      type: String,
      required: true,
      validator(value: string): boolean {
        return ['Audio', 'Subtitle', 'Video'].includes(value);
      }
    }
  },
  data() {
    return { trackIndex: -1 as number };
  },
  computed: {
    mediaSourceItem: {
      /**
       * @returns {MediaSourceInfo} The current source object (or empty if the index or media sources array don't exist)
       */
      get(): MediaSourceInfo {
        return this.item.MediaSources &&
          this.item.MediaSources[this.mediaSourceIndex]
          ? this.item.MediaSources[this.mediaSourceIndex]
          : {};
      }
    },
    tracks: {
      /**
       * @returns {MediaStream[]} List of MediaStream of the specified type
       */
      get(): MediaStream[] {
        if (!this.mediaSourceItem.MediaStreams) {
          return [];
        }

        return this.mediaSourceItem.MediaStreams.filter(
          (mediaStream) => mediaStream.Type === this.type
        );
      }
    },
    selectItems: {
      /**
       * Used to model the index as a value and use the object items for the different displays
       *
       * @returns {{text: MediaStream; value: number}[]} List of objects prepared for Vuetify v-select with the tracks as "text" and index number as "value".
       */
      get(): { text: MediaStream; value: number }[] {
        return this.tracks.map((value, idx) => {
          return { text: value, value: idx };
        });
      }
    },
    disabled: {
      /**
       * @returns {boolean} Whether to disable the v-select
       */
      get(): boolean {
        if (this.tracks.length <= 0) {
          return true;
        }

        if (this.type !== 'Subtitle' && this.tracks.length <= 1) {
          return true;
        }

        return false;
      }
    },
    placeholder: {
      /**
       * @returns {string} Placeholder to use
       */
      get(): string {
        if (this.type === 'Audio' && this.tracks.length === 0) {
          return this.$t('noAudioTracksAvailable');
        }

        if (this.type === 'Audio' && this.tracks.length !== 0) {
          return this.$t('noAudioTrackSelected');
        }

        if (this.type === 'Subtitle' && this.tracks.length === 0) {
          return this.$t('noSubtitlesAvailable');
        }

        if (this.type === 'Subtitle' && this.tracks.length !== 0) {
          return this.$t('noSubtitleSelected');
        }

        if (this.type === 'Video' && this.tracks.length === 0) {
          return this.$t('noVideoTracksAvailable');
        }

        if (this.type === 'Video' && this.tracks.length !== 0) {
          return this.$t('noVideoTrackSelected');
        }

        return this.$t('noTracksAvailable');
      }
    },
    /**
     * @returns {number|undefined} Default index to use (undefined if empty by default)
     */
    defaultIndex: {
      get(): number {
        return this.tracks.findIndex((track) => track.IsDefault);
      }
    }
  },
  watch: {
    /**
     * @param {number} newVal - New index value choosen in the v-select
     */
    trackIndex: {
      immediate: true,
      handler(newVal: number): void {
        if (this.tracks?.[newVal]?.Index) {
          this.$emit('input', this.tracks?.[newVal]?.Index);
        } else {
          this.$emit('input', -1);
        }
      }
    },
    /**
     * When the media source index is changed by the parent, we reset the selected track as it has changed
     */
    mediaSourceIndex(): void {
      this.resetDefaultTrack();
    }
  },
  /**
   * Sets the default track when loading the component
   */
  beforeMount() {
    this.resetDefaultTrack();
  },
  methods: {
    /**
     * Sets the model default track to the computed one, used at component (re)set
     */
    resetDefaultTrack(): void {
      this.trackIndex = this.defaultIndex;
    },
    /**
     * @param {MediaStream} track - Track to parse
     * @returns {string} Text to display in select when track is choosen
     */
    getTrackSelection(track: MediaStream): string {
      if (track.DisplayTitle) {
        return track.DisplayTitle;
      }

      return '';
    },
    /**
     * @param {MediaStream} track - Track to parse
     * @returns {string|undefined} Optional icon to use for the track line in the v-select menu
     */
    getTrackIcon(track: MediaStream): string | undefined {
      if (this.type === 'Audio' && track.ChannelLayout) {
        return this.getSurroundIcon(track.ChannelLayout);
      }

      return undefined;
    },
    /**
     * @param {MediaStream} track - Track to parse
     * @returns {string} Text to use for the track line in the v-select menu
     */
    getTrackTitle(track: MediaStream): string {
      if (track.DisplayTitle) {
        return track.DisplayTitle;
      }

      return '';
    },
    /**
     * @param {MediaStream} track - Track to parse
     * @returns {string|undefined} Optional subtitle to use for the track line in the v-select menu
     */
    getTrackSubtitle(track: MediaStream): string | undefined {
      if (
        (this.type === 'Audio' || this.type === 'Subtitle') &&
        track.Language
      ) {
        return this.getLanguageName(track.Language);
      } else if (this.type === 'Audio' || this.type === 'Subtitle') {
        return this.$t('undefined');
      }

      return undefined;
    },
    /**
     * @param {string} code - Converts a two letters language code to full word
     * @returns {string} Full word
     */
    getLanguageName(code: string): string {
      return langs.where('2B', code).name;
    },
    /**
     * @param {string} layout - Audio layout to get related icon
     * @returns {string} Icon name
     */
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
