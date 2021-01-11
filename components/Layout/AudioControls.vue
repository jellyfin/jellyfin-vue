<template>
  <transition name="fade" mode="in-out">
    <v-footer
      v-if="isPlaying && getCurrentlyPlayingMediaType === 'Audio'"
      key="audioControls-footer"
      app
      :color="footerColor"
      class="audioControls"
    >
      <v-container v-if="isFullScreenPlayer" fluid>
        <time-slider />
      </v-container>
      <v-container fluid>
        <v-row>
          <v-col cols="9" md="3" class="d-flex flex-row pa-0">
            <v-avatar
              v-if="!isFullScreenPlayer"
              ref="albumCover"
              tile
              size="72"
              color="primary"
            >
              <blurhash-image :item="getCurrentItem">
                <template #placeholder>
                  <v-icon dark>mdi-album</v-icon>
                </template>
              </blurhash-image>
            </v-avatar>
            <v-col class="d-flex flex-column justify-center ml-4 pt-0 mt-1">
              <v-row class="pa-0">
                <nuxt-link
                  tag="span"
                  class="text-truncate link"
                  :to="`/item/${getCurrentItem.Id}`"
                >
                  {{ getCurrentItem.Name }}
                </nuxt-link>
              </v-row>
              <v-row
                v-if="getCurrentItem.ArtistItems"
                class="align-center pa-0"
              >
                <span
                  v-for="(artist, index) in getCurrentItem.ArtistItems"
                  :key="`artist-${artist.Id}`"
                  :to="`/artist/${artist.Id}`"
                  class="m-0"
                >
                  <p>
                    <nuxt-link
                      tag="span"
                      class="text--secondary text-caption text-truncate link"
                      :to="`/artist/${artist.Id}`"
                      >{{ artist.Name }}</nuxt-link
                    >
                    <!-- Handles whitespaces -->
                    <!-- eslint-disable vue/no-v-html -->
                    <span
                      v-if="index !== getCurrentItem.ArtistItems.length - 1"
                      v-html="'&nbsp;'"
                    />
                    <!-- eslint-enable vue/no-v-html -->
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
                  :elevation="isShuffling ? '3' : '0'"
                  class="mx-1"
                  :class="isShuffling ? '' : 'text--disabled'"
                  :color="isShuffling ? 'primary' : 'text--disabled'"
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
                  elevation="6"
                  fab
                  icon
                  raised
                  rounded
                  outlined
                  class="mx-1"
                  @click="togglePause"
                >
                  <v-icon large>
                    {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
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
                  :elevation="isRepeating ? '3' : '0'"
                  class="mx-1"
                  :class="isRepeating ? '' : 'text--disabled'"
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
            <v-btn class="d-none d-md-inline-flex" icon disabled>
              <v-icon size="18">{{
                getCurrentItem.UserData.IsFavorite
                  ? 'mdi-heart'
                  : 'mdi-heart-outline'
              }}</v-icon>
            </v-btn>
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <v-btn disabled icon class="mr-2" v-bind="attrs" v-on="on">
                  <v-icon>mdi-playlist-play</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('queue') }}</span>
            </v-tooltip>
            <volume-slider />
            <transition name="fade-fast" mode="in-out">
              <v-tooltip v-if="!isFullScreenPlayer" top>
                <template #activator="{ on, attrs }">
                  <nuxt-link tag="span" :to="'/playback'">
                    <v-btn icon class="ml-2" v-bind="attrs" v-on="on">
                      <v-icon>mdi-fullscreen</v-icon>
                    </v-btn>
                  </nuxt-link>
                </template>
                <span>{{ $t('fullScreen') }}</span>
              </v-tooltip>
            </transition>
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <v-btn
                  icon
                  class="ml-2"
                  v-bind="attrs"
                  v-on="on"
                  @click="stopPlayback"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('stopPlayback') }}</span>
            </v-tooltip>
            <item-menu :item="getCurrentItem" :absolute="false" :dark="false" />
          </v-col>
          <v-col
            cols="3"
            class="d-flex d-md-none px-0 align-center justify-end"
          >
            <v-btn
              elevation="6"
              fab
              icon
              raised
              rounded
              class="mx-1"
              :class="isPaused ? '' : 'outlined-button'"
              @click="togglePause"
            >
              <v-icon>
                {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
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
              :elevation="isRepeating ? '3' : '0'"
              class="mx-1"
              :class="isRepeating ? '' : 'text--disabled'"
              :color="isRepeating ? 'primary' : undefined"
              @click="toggleRepeatMode"
            >
              <v-icon>{{ repeatIcon }}</v-icon>
            </v-btn>
            <v-btn
              icon
              fab
              small
              :elevation="isShuffling ? '3' : '0'"
              class="mx-1"
              :class="isShuffling ? '' : 'text--disabled'"
              :color="isShuffling ? 'primary' : 'text--disabled'"
              @click="toggleShuffle"
            >
              <v-icon>mdi-shuffle</v-icon>
            </v-btn>
            <item-menu :item="getCurrentItem" :absolute="false" :dark="false" />
          </v-col>
        </v-row>
        <div
          v-if="isFullScreenPlayer && getNextItem"
          class="d-flex justify-center align-center"
        >
          <div>
            <h4 class="text-overline font-italic">
              {{ $t('upNext') }}: {{ getNextItem.Name }}
            </h4>
          </div>
        </div>
      </v-container>
    </v-footer>
  </transition>
</template>

<script lang="ts">
import { BaseItemDto, ImageType, RepeatMode } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import timeUtils from '~/mixins/timeUtils';
import imageHelper from '~/mixins/imageHelper';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  mixins: [timeUtils, imageHelper],
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getCurrentlyPlayingMediaType',
      'getPreviousItem',
      'getNextItem'
    ]),
    footerColor(): string | undefined {
      if (this.isFullScreenPlayer) {
        return 'rgba(0,0,0,0.15)';
      } else {
        return undefined;
      }
    },
    isPaused(): boolean {
      return this.$store.state.playbackManager.status === PlaybackStatus.paused;
    },
    isPlaying(): boolean {
      return (
        this.$store.state.playbackManager.status !== PlaybackStatus.stopped
      );
    },
    isRepeating(): boolean {
      return (
        this.$store.state.playbackManager.repeatMode !== RepeatMode.RepeatNone
      );
    },
    repeatIcon(): string {
      if (
        this.$store.state.playbackManager.repeatMode === RepeatMode.RepeatOne
      ) {
        return 'mdi-repeat-once';
      }
      return 'mdi-repeat';
    },
    isShuffling(): boolean {
      return this.$store.state.playbackManager.isShuffling;
    },
    isFullScreenPlayer(): boolean {
      return this.$route.name === 'playback';
    }
  },
  methods: {
    ...mapActions('playbackManager', [
      'setLastItemIndex',
      'resetCurrentItemIndex',
      'setNextTrack',
      'setPreviousTrack',
      'unpause',
      'pause',
      'toggleShuffle',
      'toggleRepeatMode'
    ]),
    getImageUrl(item: BaseItemDto): string | undefined {
      const imageUrl = this.getImageUrlForElement(ImageType.Primary, { item });
      if (imageUrl) {
        return imageUrl;
      }

      return this.getImageUrlForElement(ImageType.Primary, {
        itemId: item.AlbumId
      });
    },
    stopPlayback(): void {
      this.setLastItemIndex();
      this.resetCurrentItemIndex();
      this.setNextTrack();
    },
    togglePause(): void {
      if (this.isPaused) {
        this.unpause();
      } else {
        this.pause();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/transitions.scss';
.audioControls {
  user-select: none;
}
</style>
