<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :persistent="!true"
    :transition="'slide-y-transition'"
    location="top"
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
      <v-tooltip location="top">
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            icon
            :disabled="
              !playbackManager.currentItemParsedSubtitleTracks ||
              playbackManager.currentItemParsedSubtitleTracks.length === 0
            "
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }">
            <v-icon>
              <i-mdi-closed-caption />
            </v-icon>
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
          <v-icon
            v-if="
              track.srcIndex === playbackManager.currentSubtitleStreamIndex
            ">
            <i-mdi-check />
          </v-icon>
          {{ track.label }}
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client';
import { defineComponent } from 'vue';
import { playbackManagerStore } from '@/store';
import { PlaybackTrack } from '@/store/playbackManager';

export default defineComponent({
  props: {
    nudgeTop: {
      type: [Number, String],
      default: 0
    }
  },
  setup() {
    const playbackManager = playbackManagerStore();

    return { playbackManager };
  },
  data() {
    return {
      menu: false
    };
  },
  computed: {
    tracks(): PlaybackTrack[] {
      const subs = this.playbackManager.currentItemParsedSubtitleTracks ?? [];

      return [
        {
          label: this.$t('disabled'),
          srcIndex: -1,
          type: SubtitleDeliveryMethod.External
        },
        ...subs
      ];
    }
  }
});
</script>
