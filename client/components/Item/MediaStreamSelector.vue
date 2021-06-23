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
    @input="$emit('input', $event)"
  >
    <template slot="selection" slot-scope="{ item: i }">
      {{ i.text.selection }}
    </template>

    <template slot="item" slot-scope="{ item: i, on, attrs }">
      <v-list-item v-bind="attrs" :two-line="!!i.text.subtitle" v-on="on">
        <v-list-item-avatar v-if="i.text.icon">
          <v-icon>{{ i.text.icon }}</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ i.text.title }}</v-list-item-title>
          <v-list-item-subtitle v-if="i.text.subtitle">
            {{ i.text.subtitle }}
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
import { MediaStream } from '@jellyfin/client-axios';

interface SelectItems {
  selection: string;
  subtitle: string | undefined;
  icon: string | undefined;
  title: string;
}

export default Vue.extend({
  props: {
    /**
     * Media streams to display in the selector
     */
    mediaStreams: {
      type: Array as PropType<MediaStream[]>,
      default: () => []
    }
  },
  data() {
    return { trackIndex: -1 as number };
  },
  computed: {
    type: {
      /**
       * Calculates the type for the given media streams
       *
       * @returns {string|undefined} Type of the given media streams
       */
      get(): string | undefined {
        return this.mediaStreams[0].Type;
      }
    },
    selectItems: {
      /**
       * Used to model the media stream index as a value and the potential strings
       *
       * @returns {{text: SelectItems, value: number}[]} List of objects prepared for Vuetify v-select with the strings to display as "text" and index number as "value".
       */
      get(): { text: SelectItems; value: number | undefined }[] {
        const items = this.mediaStreams.map((value, _idx) => {
          return {
            text: {
              selection: this.getTrackSelection(value),
              subtitle: this.getTrackSubtitle(value),
              icon: this.getTrackIcon(value),
              title: this.getTrackTitle(value)
            },
            value: value.Index
          };
        });

        items.unshift({
          value: -1,
          text: {
            selection: this.$t('disabled'),
            title: this.$t('disabled'),
            subtitle: undefined,
            icon: undefined
          }
        });

        return items;
      }
    },
    /**
     * @returns {number|undefined} Default index to use (undefined if none)
     */
    defaultIndex: {
      get(): number | undefined {
        return this.mediaStreams.find((track) => track.IsDefault)?.Index;
      }
    }
  },
  /**
   * Sets the default track when loading the component
   */
  beforeMount() {
    if (this.defaultIndex !== undefined) {
      this.trackIndex = this.defaultIndex;
    }

    this.$emit('input', this.trackIndex);
  },
  methods: {
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
