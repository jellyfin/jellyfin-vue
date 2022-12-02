<template>
  <v-select
    v-model="trackIndex"
    flat
    dense
    single-line
    hide-details
    class="text-truncate"
    :items="selectItems"
    @input="$emit('input', $event)">
    <template #selection="{ item }">
      {{ item.text.selection }}
    </template>

    <template #item="{ item, on, attrs }">
      <v-list-item
        v-bind="attrs"
        :lines="!!item.text.subtitle && 'two'"
        v-on="on">
        <v-avatar v-if="item.text.icon">
          <v-icon :icon="item.text.icon" />
        </v-avatar>
        <v-list-item-title>{{ item.text.title }}</v-list-item-title>
        <v-list-item-subtitle v-if="item.text.subtitle">
          {{ item.text.subtitle }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>
  </v-select>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';
import langs from 'langs';
import { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import IMdiSurroundSound20 from '~icons/mdi/surround-sound-2-0';
import IMdiSurroundSound31 from '~icons/mdi/surround-sound-3-1';
import IMdiSurroundSound51 from '~icons/mdi/surround-sound-5-1';
import IMdiSurroundSound71 from '~icons/mdi/surround-sound-7-1';
import IMdiSurroundSound from '~icons/mdi/surround-sound';

interface SelectItems {
  selection: string;
  subtitle: string | undefined;
  icon: typeof IMdiSurroundSound | undefined;
  title: string;
}

export default defineComponent({
  props: {
    /**
     * Media streams to display in the selector
     */
    mediaStreams: {
      type: Array as PropType<MediaStream[]>,
      default: () => []
    },
    /**
     * Media streams type
     */
    type: {
      type: String,
      required: true
    },
    /**
     * Overrides the default track number
     */
    defaultStreamIndex: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return { trackIndex: -1 as number };
  },
  computed: {
    /**
     * Used to model the media stream index as a value and the potential strings
     *
     * @returns List of objects prepared for Vuetify v-select with the strings to display as "text" and index number as "value".
     */
    selectItems(): { text: SelectItems; value: number | undefined }[] {
      const items = this.mediaStreams.map((value, _index) => {
        return {
          text: {
            selection: value.DisplayTitle ?? '',
            subtitle: this.getTrackSubtitle(value),
            icon: this.getTrackIcon(value),
            title: value.DisplayTitle ?? ''
          },
          value: value.Index
        };
      });

      if (this.type === 'Subtitle') {
        items.unshift({
          value: -1,
          text: {
            selection: this.$t('disabled'),
            title: this.$t('disabled'),
            subtitle: undefined,
            icon: undefined
          }
        });
      }

      return items;
    },
    /**
     * Default index to use (undefined if none)
     */
    defaultIndex(): number | undefined {
      if (this.defaultStreamIndex !== undefined) {
        return this.defaultStreamIndex;
      }

      return this.mediaStreams.find((track) => track.IsDefault)?.Index;
    }
  },
  watch: {
    defaultStreamIndex(newValue) {
      if (newValue !== this.trackIndex) {
        this.trackIndex = newValue;
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

    /**
     * Check if Type is Video and trackIndex is -1 then set trackIndex as this.selectItems[0].value
     */
    if (
      this.type === 'Video' &&
      this.trackIndex === -1 &&
      this.selectItems[0].value !== undefined
    ) {
      this.trackIndex = this.selectItems[0].value;
    }

    this.$emit('input', this.trackIndex);
  },
  methods: {
    /**
     * Get track icons
     * @returns Optional icon to use for the track line in the v-select menu
     */
    getTrackIcon(track: MediaStream): typeof IMdiSurroundSound | undefined {
      if (this.type === 'Audio' && track.ChannelLayout) {
        return this.getSurroundIcon(track.ChannelLayout);
      }
    },
    /**
     * Parse track subtitles
     * @returns Optional subtitle to use for the track line in the v-select menu
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
    },
    /**
     * Converts a two letters language code to full word
     * @returns Full word
     */
    getLanguageName(code: string): string {
      return langs.where('2B', code)?.name || '';
    },
    /**
     * Audio layout to get related icon
     * @returns Icon name
     */
    getSurroundIcon(layout: string): typeof IMdiSurroundSound {
      switch (layout) {
        case '2.0': {
          return IMdiSurroundSound20;
        }
        case '3.1': {
          return IMdiSurroundSound31;
        }
        case '5.1': {
          return IMdiSurroundSound51;
        }
        case '7.1': {
          return IMdiSurroundSound71;
        }
        default: {
          return IMdiSurroundSound;
        }
      }
    }
  }
});
</script>
