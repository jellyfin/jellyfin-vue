<template>
  <v-slide-y-reverse-transition mode="out-in">
    <v-footer
      v-if="isPlaying && getCurrentlyPlayingMediaType === 'Audio'"
      key="audioControls-footer"
      app
      :absolute="isFullScreenPlayer"
      :class="isFullScreenPlayer ? 'fullscreen pa-0' : 'pa-0'"
      class="audioControls"
    >
      <v-container v-if="isFullScreenPlayer" fluid class="mx-10 pb-0">
        <time-slider />
      </v-container>
      <v-container fluid>
        <v-row class="ma-0">
          <v-col cols="9" md="3" class="d-flex flex-row pa-0">
            <nuxt-link :to="'/fullscreen/playback'">
              <v-avatar
                v-if="!isFullScreenPlayer"
                tile
                :size="$vuetify.breakpoint.xs ? 50 : 85"
                color="primary"
              >
                <blurhash-image :item="getCurrentItem" />
              </v-avatar>
            </nuxt-link>
            <v-col class="d-flex flex-column justify-center ml-4">
              <v-row class="align-end">
                <nuxt-link
                  tag="span"
                  class="text-truncate link height-fit-content"
                  :to="getItemDetailsLink(getCurrentItem)"
                >
                  {{ getCurrentItem.Name }}
                </nuxt-link>
              </v-row>
              <v-row v-if="getCurrentItem.ArtistItems" class="align-start">
                <span
                  v-for="artist in getCurrentItem.ArtistItems"
                  :key="`artist-${artist.Id}`"
                  :to="getItemDetailsLink(artist, 'MusicArtist')"
                >
                  <p class="mb-0 mr-2">
                    <nuxt-link
                      tag="span"
                      class="text--secondary text-caption text-truncate link"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      >{{ artist.Name }}</nuxt-link
                    >
                  </p>
                </span>
              </v-row>
            </v-col>
          </v-col>
          <v-col cols="6" class="pa-0 d-none d-md-inline">
            <div class="d-flex flex-column justify-center">
              <div class="d-flex align-center justify-center">
                <v-btn
                  icon
                  fab
                  small
                  class="mx-1 active-button"
                  :color="isShuffling ? 'primary' : undefined"
                  @click="toggleShuffle"
                >
                  <v-icon>mdi-shuffle</v-icon>
                </v-btn>
                <v-btn
                  icon
                  :disabled="!getPreviousItem"
                  class="mx-1"
                  @click="setPreviousTrack"
                >
                  <v-icon>mdi-skip-previous</v-icon>
                </v-btn>
                <v-btn
                  icon
                  raised
                  rounded
                  class="mx-1 active-button"
                  @click="playPause"
                >
                  <v-icon large>
                    {{
                      isPaused
                        ? 'mdi-play-circle-outline'
                        : 'mdi-pause-circle-outline'
                    }}
                  </v-icon>
                </v-btn>
                <v-btn
                  icon
                  :disabled="!getNextItem"
                  class="mx-1"
                  @click="setNextTrack"
                >
                  <v-icon>mdi-skip-next</v-icon>
                </v-btn>
                <v-btn
                  icon
                  fab
                  small
                  class="mx-1 active-button"
                  :color="isRepeating ? 'primary' : undefined"
                  @click="toggleRepeatMode"
                >
                  <v-icon>{{ repeatIcon }}</v-icon>
                </v-btn>
              </div>
              <time-slider v-if="!isFullScreenPlayer" />
            </div>
          </v-col>
          <v-col cols="3" class="d-none d-md-flex align-center justify-end">
            <like-button :item="getCurrentItem" class="active-button" />
            <queue-button :item="getCurrentItem" class="active-button" />
            <div class="hidden-lg-and-down">
              <volume-slider />
            </div>
            <item-menu :item="getCurrentItem" />
            <v-btn
              v-show="!isFullScreenPlayer"
              icon
              nuxt
              to="/fullscreen/playback"
            >
              <v-icon>mdi-fullscreen</v-icon>
            </v-btn>
            <v-btn v-show="isFullScreenPlayer" icon @click="$router.back()">
              <v-icon>mdi-fullscreen-exit</v-icon>
            </v-btn>
          </v-col>
          <v-col
            cols="3"
            class="d-flex d-md-none pa-0 align-center justify-end"
          >
            <v-btn
              icon
              raised
              rounded
              class="mx-1 active-button"
              @click="playPause"
            >
              <v-icon>
                {{
                  isPaused
                    ? 'mdi-play-circle-outline'
                    : 'mdi-pause-circle-outline'
                }}
              </v-icon>
            </v-btn>
            <v-btn
              icon
              :disabled="!getNextItem"
              class="mx-1"
              @click="setNextTrack"
            >
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
            <v-btn
              icon
              class="mx-1 active-button hidden-xs-only"
              :color="isRepeating ? 'primary' : undefined"
              @click="toggleRepeatMode"
            >
              <v-icon>{{ repeatIcon }}</v-icon>
            </v-btn>
            <v-btn
              icon
              class="mx-1 active-button hidden-xs-only"
              :color="isShuffling ? 'primary' : undefined"
              @click="toggleShuffle"
            >
              <v-icon>mdi-shuffle</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <div
          v-if="isFullScreenPlayer"
          class="d-flex justify-center align-center"
        >
          <div>
            <h4 class="text-overline font-italic">
              {{
                !!getNextItem
                  ? $t('upNextName', { upNextItemName: getNextItem.Name })
                  : ''
              }}
              <br />
            </h4>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-slide-y-reverse-transition>
</template>

<script lang="ts">
import { RepeatMode } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import timeUtils from '~/mixins/timeUtils';
import imageHelper from '~/mixins/imageHelper';
import { PlaybackStatus } from '~/store/playbackManager';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [timeUtils, imageHelper, itemHelper],
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getCurrentlyPlayingMediaType',
      'getPreviousItem',
      'getNextItem'
    ]),
    ...mapState('playbackManager', ['status', 'repeatMode', 'isShuffling']),
    isPaused(): boolean {
      return this.status === PlaybackStatus.Paused;
    },
    isPlaying(): boolean {
      return this.status !== PlaybackStatus.Stopped;
    },
    isRepeating(): boolean {
      return this.repeatMode !== RepeatMode.RepeatNone;
    },
    repeatIcon(): string {
      if (this.repeatMode === RepeatMode.RepeatOne) {
        return 'mdi-repeat-once';
      }

      return 'mdi-repeat';
    },
    // Checking for route is faster to switch the controls than checking for the store
    // TODO: Remove this as soon as we can use the fullpage layout in music player
    // (i.e Vue 3) https://github.com/nuxt/nuxt.js/issues/8592
    isFullScreenPlayer(): boolean {
      return this.$route.fullPath === '/fullscreen/playback';
    }
  },
  methods: {
    ...mapActions('playbackManager', [
      'setLastItemIndex',
      'resetCurrentItemIndex',
      'setNextTrack',
      'setPreviousTrack',
      'toggleShuffle',
      'toggleRepeatMode',
      'playPause'
    ])
  }
});
</script>

<style lang="scss" scoped>
.audioControls {
  user-select: none;
}

.height-fit-content {
  height: fit-content;
}

.audioControls.fullscreen {
  background-color: rgba(255, 255, 255, 0.15);
}

.theme--dark .audioControls.fullscreen {
  background-color: rgba(0, 0, 0, 0.15);
}

// HACK: https://github.com/vuetifyjs/vuetify/issues/8436.
// https://vuetifyjs.com/en/api/v-btn/#retain-focus-on-click prop was added
// but it seems we're using a prop combination that it's incompatible with it: NaN;

// SO link: https://stackoverflow.com/questions/57830767/is-it-default-for-vuetify-to-keep-active-state-on-buttons-after-click-how-do-yo/57831256#57831256
.active-button:focus::before {
  opacity: 0 !important;
}
</style>
