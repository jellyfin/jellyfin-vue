<template>
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
        <video-player v-if="isPlaying" />
        <v-fade-transition>
          <v-overlay v-show="hover && isMinimized" absolute>
            <v-btn icon @click="toggleMinimized">
              <v-icon>mdi-arrow-expand-all</v-icon>
            </v-btn>
          </v-overlay>
        </v-fade-transition>
      </v-card>
    </v-hover>
  </player-dialog>
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
      'setLastProgressUpdate'
    ]),
    getContentClass(): string {
      return `player ${
        this.isMinimized
          ? 'player--minimized align-self-end'
          : 'player--fullscreen'
      }`;
    }
  }
});
</script>

<style lang="scss">
.v-card.player-card {
  background-color: black !important;
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
