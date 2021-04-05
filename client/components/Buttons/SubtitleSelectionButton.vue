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
    min-height="25em"
    max-height="25em"
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
            <v-icon>mdi-closed-caption</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('subtitles') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item
          v-for="(track, index) of getCurrentItemSubtitleTracks"
          :key="track.Index"
        >
          <v-list-item-icon>
            <v-icon v-if="index === currentSubtitleStreamIndex">
              mdi-check
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            {{ track.DisplayTitle }}
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapState } from 'vuex';

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
    ...mapGetters('playbackManager', ['getCurrentItemSubtitleTracks']),
    ...mapState('playbackManager', ['currentSubtitleStreamIndex'])
  }
});
</script>
