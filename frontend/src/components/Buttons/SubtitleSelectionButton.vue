<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="true"
    :transition="'slide-y-transition'"
    top
    :nudge-top="nudgeTop"
    offset-y
    min-width="25em"
    max-width="25em"
    min-height="25em"
    max-height="25em"
    :z-index="500"
    class="menu"
    @input="$emit('input', $event)">
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <v-tooltip top>
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            icon
            :disabled="
              playbackManager.getCurrentItemParsedSubtitleTracks.length === 0
            "
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }">
            <v-icon>mdi-closed-caption</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('subtitles') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item
          v-for="track of tracks"
          :key="track.srcIndex"
          @click="playbackManager.currentSubtitleStreamIndex = track.srcIndex">
          <v-list-item-icon>
            <v-icon
              v-if="
                track.srcIndex === playbackManager.currentSubtitleStreamIndex
              ">
              mdi-check
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            {{ track.label }}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { SubtitleDeliveryMethod } from '@jellyfin/client-axios';
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { playbackManagerStore } from '~/store';
import { PlaybackTrack } from '~/store/playbackManager';

export default defineComponent({
  props: {
    nudgeTop: {
      type: [Number, String],
      default: 0
    }
  },
  data() {
    return {
      menu: false
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    tracks(): PlaybackTrack[] {
      const subs = this.playbackManager
        .getCurrentItemParsedSubtitleTracks as PlaybackTrack[];

      return [
        {
          label: this.$t('disabled'),
          srcIndex: -1,
          type: SubtitleDeliveryMethod.External
        }
      ].concat(subs) as PlaybackTrack[];
    }
  }
});
</script>
