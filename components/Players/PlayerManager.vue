<template>
  <div>
    <audio-player
      v-if="isPlaying && getCurrentlyPlayingMediaType === 'Audio'"
      class="d-none"
    />
    <player-dialog
      dark
      persistent
      hide-overlay
      no-click-animation
      scrollable
      :fullscreen="!isMinimized"
      :retain-focus="!isMinimized"
      :content-class="getContentClass()"
      :width="$vuetify.breakpoint.mobile ? '60vw' : '25vw'"
      :value="isPlaying"
    >
      <v-hover v-slot="{ hover }">
        <v-card class="player-card" width="100%">
          <video-player
            v-if="isPlaying && getCurrentlyPlayingMediaType === 'Video'"
          />
          <v-fade-transition>
            <v-overlay v-show="hover && isMinimized" absolute>
              <div class="d-flex flex-column player-overlay">
                <div class="d-flex flex-row">
                  <v-btn icon @click="toggleMinimized">
                    <v-icon>mdi-arrow-expand-all</v-icon>
                  </v-btn>
                  <v-spacer />
                  <v-btn icon @click="stopPlayback">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <div
                  class="absolute d-flex flex-row justify-center align-center"
                >
                  <v-btn
                    class="all-pointer-events"
                    icon
                    large
                    @click="setPreviousTrack"
                  >
                    <v-icon size="32">mdi-skip-previous</v-icon>
                  </v-btn>
                  <v-btn
                    class="all-pointer-events"
                    icon
                    x-large
                    @click="togglePause"
                  >
                    <v-icon size="48">{{
                      isPaused ? 'mdi-play' : 'mdi-pause'
                    }}</v-icon>
                  </v-btn>
                  <v-btn
                    class="all-pointer-events"
                    icon
                    large
                    @click="setNextTrack"
                  >
                    <v-icon size="32">mdi-skip-next</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </v-hover>
    </player-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import timeUtils from '~/mixins/timeUtils';
import { AppState } from '~/store';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  mixins: [timeUtils],
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getPreviousItem',
      'getCurrentlyPlayingMediaType',
      'getCurrentlyPlayingType'
    ]),
    isPlaying(): boolean {
      return (
        this.$store.state.playbackManager.status !== PlaybackStatus.stopped
      );
    },
    isPaused(): boolean {
      return this.$store.state.playbackManager.status === PlaybackStatus.paused;
    },
    isMinimized(): boolean {
      return this.$store.state.playbackManager.isMinimized;
    }
  },
  created() {
    this.$store.subscribe((mutation, state: AppState) => {
      switch (mutation.type) {
        case 'playbackManager/START_PLAYBACK':
        case 'playbackManager/INCREASE_QUEUE_INDEX':
          // Report playback stop for the previous item
          if (
            state.playbackManager.currentTime !== null &&
            this.getPreviousItem.Id
          ) {
            this.$api.playState.reportPlaybackStopped(
              {
                playbackStopInfo: {
                  ItemId: this.getPreviousItem.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  PositionTicks: this.msToTicks(
                    state.playbackManager.currentTime * 1000
                  )
                }
              },
              { progress: false }
            );
          }

          // Then report the start of the next one
          if (this.getCurrentItem.Id !== null) {
            this.$api.playState.reportPlaybackStart(
              {
                playbackStartInfo: {
                  CanSeek: true,
                  ItemId: this.getCurrentItem.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  MediaSourceId: state.playbackManager.currentMediaSource?.Id,
                  AudioStreamIndex:
                    state.playbackManager.currentAudioStreamIndex,
                  SubtitleStreamIndex:
                    state.playbackManager.currentSubtitleStreamIndex
                }
              },
              { progress: false }
            );
          }

          this.setLastProgressUpdate({ progress: new Date().getTime() });
          break;
        case 'playbackManager/SET_CURRENT_TIME': {
          const now = new Date().getTime();

          if (
            this.getCurrentItem !== null &&
            now - state.playbackManager.lastProgressUpdate > 1000 &&
            state.playbackManager.currentTime !== null
          ) {
            this.$api.playState.reportPlaybackProgress(
              {
                playbackProgressInfo: {
                  ItemId: this.getCurrentItem.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  IsPaused: false,
                  PositionTicks: Math.round(
                    this.msToTicks(state.playbackManager.currentTime * 1000)
                  )
                }
              },
              { progress: false }
            );

            this.setLastProgressUpdate({ progress: new Date().getTime() });
          }
          break;
        }
        case 'playbackManager/STOP_PLAYBACK':
          if (state.playbackManager.currentTime !== null) {
            this.$api.playState.reportPlaybackStopped(
              {
                playbackStopInfo: {
                  ItemId: this.getPreviousItem.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  PositionTicks: this.msToTicks(
                    state.playbackManager.currentTime * 1000
                  )
                }
              },
              { progress: false }
            );

            this.setLastProgressUpdate({ progress: 0 });
          }
          break;
        case 'playbackManager/PAUSE_PLAYBACK':
          if (state.playbackManager.currentTime !== null) {
            this.$api.playState.reportPlaybackProgress(
              {
                playbackProgressInfo: {
                  ItemId: this.getCurrentItem.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  IsPaused: true,
                  PositionTicks: Math.round(
                    this.msToTicks(state.playbackManager.currentTime * 1000)
                  )
                }
              },
              { progress: false }
            );

            this.setLastProgressUpdate({ progress: new Date().getTime() });
          }
          break;
      }
    });
  },
  methods: {
    ...mapActions('playbackManager', [
      'toggleMinimized',
      'setLastProgressUpdate',
      'resetCurrentItemIndex',
      'setNextTrack',
      'setPreviousTrack',
      'setLastItemIndex',
      'resetLastItemIndex',
      'pause',
      'unpause'
    ]),
    getContentClass(): string {
      return `player ${
        this.isMinimized
          ? 'player--minimized align-self-end'
          : 'player--fullscreen'
      }`;
    },
    stopPlayback() {
      this.setLastItemIndex();
      this.resetCurrentItemIndex();
      this.setNextTrack();
    },
    togglePause() {
      if (this.isPaused) {
        this.unpause();
      } else {
        this.pause();
      }
    }
  }
});
</script>

<style lang="scss">
.absolute {
  pointer-events: none;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.all-pointer-events {
  pointer-events: all;
}

.v-card.player-card {
  background-color: black !important;
}

.v-overlay .v-overlay__content {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.player-overlay {
  height: 100%;
}

.player--fullscreen {
  position: relative;
  width: 100vw !important;
  height: 100vh !important;
  max-height: 100% !important;
  margin: 0 !important;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.player--minimized {
  justify-self: end !important;
  position: relative;
  margin: 0 !important;
  margin-left: auto !important;
  top: auto;
  left: auto;
  bottom: 2em;
  right: 2em;
}
</style>
