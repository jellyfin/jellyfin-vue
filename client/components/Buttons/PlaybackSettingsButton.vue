<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="false"
    :transition="'slide-y-transition'"
    top
    :nudge-top="nudgeTop"
    offset-y
    min-width="25em"
    max-width="25em"
    :z-index="500"
    class="menu"
  >
    <template #activator="{ on: menu, attrs }">
      <v-tooltip top>
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            icon
            disabled
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('playbackSettings') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('quality') }}</label>
            </v-col>
            <v-col :cols="8">
              <track-selector
                :item="getCurrentItem"
                :media-source-index="0"
                type="Subtitles"
                @input="currentAudioTrack = $event"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('audio') }}</label>
            </v-col>
            <v-col :cols="8">
              <track-selector
                :item="getCurrentItem"
                :media-source-index="0"
                type="Audio"
                @input="currentAudioTrack = $event"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('subtitles') }}</label>
            </v-col>
            <v-col :cols="8">
              <track-selector
                :item="getCurrentItem"
                :media-source-index="0"
                type="Subtitles"
                @input="currentAudioTrack = $event"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('speed') }}</label>
            </v-col>
            <v-col :cols="8">
              <track-selector
                :item="getCurrentItem"
                :media-source-index="0"
                type="Subtitles"
                @input="currentAudioTrack = $event"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            {{ $t('playbackData') }}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

export default Vue.extend({
  props: {
    nudgeTop: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      menu: false
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem'])
  }
});
</script>
