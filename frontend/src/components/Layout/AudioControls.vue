<template>
  <v-slide-y-reverse-transition mode="out-in">
    <v-footer
      v-if="
        playbackManager.isPlaying &&
        playbackManager.getCurrentlyPlayingMediaType === 'Audio'
      "
      key="audioControls-footer"
      app
      :absolute="isFullScreenPlayer"
      :class="isFullScreenPlayer ? 'fullscreen pa-0' : 'pa-0'"
      class="audioControls">
      <v-container v-if="isFullScreenPlayer" fluid class="mx-10 pb-0">
        <time-slider />
      </v-container>
      <v-container fluid>
        <v-row class="ma-0">
          <v-col cols="9" md="3" class="d-flex flex-row pa-0">
            <router-link :to="'/fullscreen/playback'">
              <v-avatar
                v-if="!isFullScreenPlayer"
                :size="$vuetify.display.xs ? 50 : 85"
                color="primary">
                <blurhash-image :item="playbackManager.getCurrentItem" />
              </v-avatar>
            </router-link>
            <v-col class="d-flex flex-column justify-center ml-4">
              <v-row class="align-end">
                <router-link
                  tag="span"
                  class="text-truncate link height-fit-content"
                  :to="getItemDetailsLink(playbackManager.getCurrentItem)">
                  {{ playbackManager.getCurrentItem.Name }}
                </router-link>
              </v-row>
              <v-row
                v-if="playbackManager.getCurrentItem.ArtistItems"
                class="align-start">
                <span
                  v-for="artist in playbackManager.getCurrentItem.ArtistItems"
                  :key="`artist-${artist.Id}`"
                  :to="getItemDetailsLink(artist, 'MusicArtist')">
                  <p class="mb-0 mr-2">
                    <router-link
                      tag="span"
                      class="text--secondary text-caption text-truncate link"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      >{{ artist.Name }}</router-link
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
                  size="small"
                  class="mx-1 active-button"
                  :color="playbackManager.isShuffling ? 'primary' : undefined"
                  @click="playbackManager.toggleShuffle">
                  <v-icon>mdi-shuffle</v-icon>
                </v-btn>
                <v-btn
                  icon
                  class="mx-1"
                  @click="playbackManager.setPreviousTrack">
                  <v-icon>mdi-skip-previous</v-icon>
                </v-btn>
                <v-btn
                  icon
                  raised
                  rounded
                  :loading="playbackManager.isBuffering"
                  class="mx-1 active-button"
                  @click="playbackManager.playPause">
                  <v-icon size="large">
                    {{
                      playbackManager.isPaused
                        ? 'mdi-play-circle-outline'
                        : 'mdi-pause-circle-outline'
                    }}
                  </v-icon>
                </v-btn>
                <v-btn
                  icon
                  :disabled="!playbackManager.getNextItem"
                  class="mx-1"
                  @click="playbackManager.setNextTrack">
                  <v-icon>mdi-skip-next</v-icon>
                </v-btn>
                <v-btn
                  icon
                  fab
                  size="small"
                  class="mx-1 active-button"
                  :color="playbackManager.isRepeating ? 'primary' : undefined"
                  @click="playbackManager.toggleRepeatMode">
                  <v-icon>{{ repeatIcon }}</v-icon>
                </v-btn>
              </div>
              <time-slider v-if="!isFullScreenPlayer" />
            </div>
          </v-col>
          <v-col cols="3" class="d-none d-md-flex align-center justify-end">
            <like-button
              :item="playbackManager.getCurrentItem"
              class="active-button" />
            <queue-button nudge-top="35" />
            <div class="hidden-lg-and-down">
              <volume-slider />
            </div>
            <item-menu :item="playbackManager.getCurrentItem" />
            <v-btn
              v-show="!isFullScreenPlayer"
              icon
              nuxt
              to="/fullscreen/playback">
              <v-icon>mdi-fullscreen</v-icon>
            </v-btn>
            <v-btn v-show="isFullScreenPlayer" icon @click="$router.back()">
              <v-icon>mdi-fullscreen-exit</v-icon>
            </v-btn>
          </v-col>
          <v-col
            cols="3"
            class="d-flex d-md-none pa-0 align-center justify-end">
            <v-btn
              icon
              raised
              rounded
              class="mx-1 active-button"
              @click="playbackManager.playPause">
              <v-icon>
                {{
                  playbackManager.isPaused
                    ? 'mdi-play-circle-outline'
                    : 'mdi-pause-circle-outline'
                }}
              </v-icon>
            </v-btn>
            <v-btn
              icon
              :disabled="!playbackManager.getNextItem"
              class="mx-1"
              @click="playbackManager.setNextTrack">
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
            <v-btn
              icon
              class="mx-1 active-button hidden-xs-only"
              :color="playbackManager.isRepeating ? 'primary' : undefined"
              @click="playbackManager.toggleRepeatMode">
              <v-icon>{{ repeatIcon }}</v-icon>
            </v-btn>
            <v-btn
              icon
              class="mx-1 active-button hidden-xs-only"
              :color="playbackManager.isShuffling ? 'primary' : undefined"
              @click="playbackManager.toggleShuffle">
              <v-icon>mdi-shuffle</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <div
          v-if="isFullScreenPlayer"
          class="d-flex justify-center align-center">
          <div>
            <h4 class="text-overline font-italic">
              {{
                !!playbackManager.getNextItem
                  ? $t('upNextName', {
                      upNextItemName: playbackManager.getNextItem.Name
                    })
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
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { playbackManagerStore } from '~/store';
import { getItemDetailsLink } from '~/utils/items';
import { RepeatMode } from '~/store/playbackManager';

export default defineComponent({
  computed: {
    ...mapStores(playbackManagerStore),
    repeatIcon(): string {
      if (this.playbackManager.repeatMode === RepeatMode.RepeatOne) {
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
    getItemDetailsLink
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
</style>
