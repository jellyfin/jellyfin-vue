<template>
  <v-container fluid>
    <v-row>
      <v-col cols="9" md="3" class="d-flex flex-row pa-0">
        <v-avatar ref="albumCover" tile size="72" color="primary">
          <v-img :src="getImageUrl(getCurrentItem.AlbumId)">
            <template #placeholder>
              <v-icon dark>mdi-album</v-icon>
            </template>
          </v-img>
        </v-avatar>
        <div class="d-flex flex-column justify-center ml-4">
          <span class="font-weight-medium mt-md-n2">
            <nuxt-link
              tag="span"
              class="text-truncate link"
              :to="`/item/${getCurrentItem.AlbumId}`"
            >
              {{ getCurrentItem.Name }}
            </nuxt-link>
            <v-btn class="d-none d-md-inline-flex" icon disabled>
              <v-icon size="18">{{
                getCurrentItem.UserData.IsFavorite
                  ? 'mdi-heart'
                  : 'mdi-heart-outline'
              }}</v-icon>
            </v-btn>
          </span>
          <nuxt-link
            tag="span"
            class="text--secondary text-caption text-truncate mt-md-n2 link"
            :to="`/artist/${getCurrentItem.AlbumArtists[0].Id}`"
          >
            {{ getCurrentItem.AlbumArtist }}
          </nuxt-link>
        </div>
      </v-col>
      <v-col cols="6" class="pa-0 d-none d-md-inline">
        <div class="d-flex flex-column justify-center">
          <div class="d-flex align-center justify-center">
            <v-btn disabled icon class="mx-1">
              <v-icon>mdi-shuffle</v-icon>
            </v-btn>
            <v-btn icon class="mx-1" @click="setPreviousTrack">
              <v-icon>mdi-skip-previous</v-icon>
            </v-btn>
            <v-btn icon large class="mx-1" @click="togglePause">
              <v-icon large>
                {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
              </v-icon>
            </v-btn>
            <v-btn icon class="mx-1" @click="stopPlayback">
              <v-icon>mdi-stop</v-icon>
            </v-btn>
            <v-btn icon class="mx-1" @click="setNextTrack">
              <v-icon>mdi-skip-next</v-icon>
            </v-btn>
            <v-btn disabled icon class="mx-1">
              <v-icon>mdi-repeat-off</v-icon>
            </v-btn>
          </div>
          <v-slider
            :value="sliderValue"
            hide-details
            :max="runtime"
            validate-on-blur
            thumb-label
            :step="0"
            @end="onPositionChange"
            @change="onPositionChange"
            @mousedown="onClick"
            @mouseup="onClick"
            @input="onInputChange"
          >
            <template #prepend>
              <span class="mt-1">
                {{ getRuntime(realPosition) }}
              </span>
            </template>
            <template #thumb-label>
              {{ getRuntime(sliderValue) }}
            </template>
            <template #append>
              <span class="mt-1">
                {{ getRuntime(runtime) }}
              </span>
            </template>
          </v-slider>
        </div>
      </v-col>
      <v-col cols="3" class="d-none d-md-flex align-center justify-end">
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-btn disabled icon class="mr-2" v-bind="attrs" v-on="on">
              <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('queue') }}</span>
        </v-tooltip>
        <volume-slider />
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-btn disabled icon class="ml-2" v-bind="attrs" v-on="on">
              <v-icon>mdi-fullscreen</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('fullScreen') }}</span>
        </v-tooltip>
      </v-col>
      <v-col cols="3" class="d-flex d-md-none px-0 align-center justify-end">
        <v-btn icon>
          <v-icon>mdi-heart</v-icon>
        </v-btn>
        <v-btn icon @click="togglePause">
          <v-icon>
            {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { ImageType } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  mixins: [timeUtils, imageHelper],
  data() {
    return {
      clicked: false,
      currentInput: 0
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    runtime(): number {
      return this.ticksToMs(this.getCurrentItem.RunTimeTicks) / 1000;
    },
    isPaused(): boolean {
      return this.$store.state.playbackManager.status === PlaybackStatus.paused;
    },
    sliderValue: {
      get(): number {
        if (!this.clicked) {
          return this.$store.state.playbackManager.currentTime;
        }
        return this.currentInput;
      }
    },
    realPosition: {
      get(): number {
        return this.$store.state.playbackManager.currentTime;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', [
      'changeCurrentTime',
      'setLastItemIndex',
      'resetCurrentItemIndex',
      'setNextTrack',
      'setPreviousTrack',
      'unpause',
      'pause'
    ]),
    getImageUrl(itemId: string): string {
      const element = this.$refs.albumCover as HTMLElement;
      return this.getImageUrlForElement(ImageType.Primary, {
        itemId,
        element
      });
    },
    getRuntime(seconds: number): string {
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds - minutes * 60);

      /**
       * Formats the second number
       * E.g. 7 -> 07
       *
       * @param {string} seconds Number to format
       * @returns {string} Formatted seconds number
       */
      function formatSeconds(seconds: string): string {
        return ('0' + seconds).slice(-2);
      }

      return `${minutes}:${formatSeconds(seconds.toString())}`;
    },
    onPositionChange(value: number): void {
      if (!this.clicked) {
        this.changeCurrentTime({ time: value });
      }
    },
    onInputChange(value: number): void {
      this.currentInput = value;
    },
    onClick(): void {
      this.currentInput = this.realPosition;
      this.clicked = !this.clicked;
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

<style scoped>
.v-input >>> .v-slider__thumb-container,
.v-input >>> .v-slider__track-background,
.v-input >>> .v-slider__track-fill {
  transition: none !important;
}
</style>
