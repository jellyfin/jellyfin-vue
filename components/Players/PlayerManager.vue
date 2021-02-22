<template>
  <div>
    <audio-player
      v-if="isPlaying && getCurrentlyPlayingMediaType === 'Audio'"
      class="d-none"
    />
    <player-dialog
      v-if="isPlaying && getCurrentlyPlayingMediaType === 'Video'"
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
          <video-player />
          <!-- Mini Player Overlay -->
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
                    @click="playPause"
                  >
                    <v-icon size="48">
                      {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
                    </v-icon>
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
          <!-- Full Screen OSD -->
          <v-fade-transition>
            <v-overlay v-show="!isMinimized && showFullScreenOverlay" absolute>
              <div
                class="d-flex flex-column justify-space-between align-center player-overlay"
              >
                <div class="osd-top">
                  <div class="d-flex justify-space-between align-center">
                    <div class="d-flex">
                      <v-btn icon @click="stopPlayback">
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                      <v-btn icon @click="toggleMinimized">
                        <v-icon> mdi-chevron-down </v-icon>
                      </v-btn>
                      <v-btn
                        v-if="supportedFeatures.pictureInPicture"
                        icon
                        disabled
                      >
                        <v-icon> mdi-picture-in-picture-bottom-right </v-icon>
                      </v-btn>
                    </div>
                    <p class="ma-0 text-center">{{ currentItemName }}</p>
                    <div class="d-flex">
                      <v-btn icon disabled>
                        <v-icon> mdi-autorenew </v-icon>
                      </v-btn>
                      <v-btn v-if="supportedFeatures.airplay" icon disabled>
                        <v-icon> mdi-apple-airplay </v-icon>
                      </v-btn>
                      <v-btn icon disabled>
                        <v-icon> mdi-cast </v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>

                <div class="px-4 osd-bottom">
                  <div>
                    <time-slider />
                    <div class="d-flex justify-space-between">
                      <div>
                        <v-btn icon @click="setPreviousTrack">
                          <v-icon> mdi-skip-previous </v-icon>
                        </v-btn>
                        <v-btn icon @click="playPause">
                          <v-icon>
                            {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
                          </v-icon>
                        </v-btn>
                        <v-btn icon @click="setNextTrack">
                          <v-icon icon> mdi-skip-next </v-icon>
                        </v-btn>
                      </div>
                      <div>
                        <v-btn icon disabled>
                          <v-icon> mdi-closed-caption </v-icon>
                        </v-btn>
                        <v-btn icon disabled>
                          <v-icon> mdi-cog </v-icon>
                        </v-btn>

                        <v-btn icon disabled>
                          <v-icon> mdi-fullscreen </v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
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
import { ImageType } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { AppState } from '~/store';
import { PlaybackStatus } from '~/store/playbackManager';
import {
  getSupportedFeatures,
  SupportedFeaturesInterface
} from '~/utils/supportedFeatures';

export default Vue.extend({
  mixins: [timeUtils, imageHelper],
  data() {
    return {
      showFullScreenOverlay: false,
      fullScreenOverlayTimer: null as number | null,
      supportedFeatures: {} as SupportedFeaturesInterface
    };
  },
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getPreviousItem',
      'getNextItem',
      'getCurrentlyPlayingMediaType'
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
    },
    currentItemName(): string {
      switch (this.getCurrentItem.Type) {
        case 'Episode':
          return `${this.getCurrentItem.SeriesName} - S${this.getCurrentItem.ParentIndexNumber}E${this.getCurrentItem.IndexNumber} -  ${this.getCurrentItem.Name}`;
        case 'Movie':
        default:
          return this.getCurrentItem.Name;
      }
    }
  },
  created() {
    this.$store.subscribe((mutation, state: AppState) => {
      switch (mutation.type) {
        case 'playbackManager/INCREASE_QUEUE_INDEX':
        case 'playbackManager/DECREASE_QUEUE_INDEX':
        case 'playbackManager/SET_CURRENT_ITEM_INDEX':
          // Report playback stop for the previous item
          if (
            state.playbackManager.currentTime !== null &&
            this.getPreviousItem?.Id
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
          if (this.getCurrentItem?.Id) {
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

            this.updateMetadata();
          }

          this.setLastProgressUpdate({ progress: new Date().getTime() });
          break;
        case 'playbackManager/SET_CURRENT_TIME': {
          if (state.playbackManager.status === PlaybackStatus.playing) {
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

            this.resetMetadata();

            this.removeMediaHandlers();
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
  beforeMount() {
    this.supportedFeatures = getSupportedFeatures();
  },
  mounted() {
    document.addEventListener('mousemove', this.handleMouseMove);

    this.addMediaHandlers();

    this.$store.subscribe((mutation, state: AppState) => {
      switch (mutation.type) {
        case 'playbackManager/TOGGLE_MINIMIZE':
          if (state.playbackManager.isMinimized === true) {
            window.removeEventListener('keydown', this.handleKeyPress);
          } else if (state.playbackManager.isMinimized === false) {
            window.addEventListener('keydown', this.handleKeyPress);
          }
      }
    });
  },
  beforeDestroy() {
    if (this.fullScreenOverlayTimer) {
      clearTimeout(this.fullScreenOverlayTimer);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
  },
  methods: {
    ...mapActions('playbackManager', [
      'toggleMinimized',
      'setLastProgressUpdate',
      'resetCurrentItemIndex',
      'setNextTrack',
      'setPreviousTrack',
      'setLastItemIndex',
      'playPause',
      'pause',
      'unpause',
      'skipForward',
      'skipBackward',
      'changeCurrentTime'
    ]),
    handleMouseMove(): void {
      if (
        this.isPlaying &&
        this.getCurrentlyPlayingMediaType === 'Video' &&
        !this.isMinimized
      ) {
        if (this.fullScreenOverlayTimer) {
          clearTimeout(this.fullScreenOverlayTimer);
        }
        this.showFullScreenOverlay = true;
        this.fullScreenOverlayTimer = window.setTimeout(() => {
          this.showFullScreenOverlay = false;
          this.fullScreenOverlayTimer = null;
        }, 3000);
      }
    },
    getContentClass(): string {
      return `player ${
        this.isMinimized
          ? 'player--minimized align-self-end'
          : 'player--fullscreen'
      }`;
    },
    stopPlayback(): void {
      this.setLastItemIndex();
      this.resetCurrentItemIndex();
      this.setNextTrack();
    },
    handleKeyPress(e: KeyboardEvent): void {
      if (!this.isMinimized && this.isPlaying) {
        switch (e.key) {
          case 'Spacebar':
          case ' ':
            this.playPause();
            break;
          case 'ArrowRight':
            this.skipForward();
            break;
          case 'ArrowLeft':
            this.skipBackward();
            break;
        }
      }
    },
    addMediaHandlers(): void {
      if (navigator.mediaSession) {
        const actionHandlers = [
          [
            'play',
            (): void => {
              this.unpause();
              if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
              }
            }
          ],
          [
            'pause',
            (): void => {
              this.pause();
              if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'paused';
              }
            }
          ],
          [
            'previoustrack',
            (): void => {
              this.setPreviousTrack();
            }
          ],
          [
            'nexttrack',
            (): void => {
              this.setNextTrack();
            }
          ],
          [
            'stop',
            (): void => {
              this.stopPlayback();
              if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'none';
              }
            }
          ],
          [
            'seekbackward',
            (): void => {
              this.skipBackward();
            }
          ],
          [
            'seekforward',
            (): void => {
              this.skipForward();
            }
          ],
          [
            'seekto',
            (): void => {
              this.changeCurrentTime({ time: 1 });
            }
          ]
        ];

        for (const [action, handler] of actionHandlers) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            navigator.mediaSession.setActionHandler(action, handler);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(
              `The media session action "${action}" is not supported.`
            );
          }
        }
      }
    },
    removeMediaHandlers(): void {
      if (navigator.mediaSession) {
        const actionHandlers = [
          ['play', null],
          ['pause', null],
          ['previoustrack', null],
          ['nexttrack', null],
          ['stop', null],
          ['seekbackward', null],
          ['seekforward', null],
          ['seekto', null]
        ];

        for (const [action, handler] of actionHandlers) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            navigator.mediaSession.setActionHandler(action, handler);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(`Error removing mediaSession action: "${action}".`);
          }
        }
      }
    },
    resetMetadata(): void {
      if (window.navigator.mediaSession) {
        window.navigator.mediaSession.metadata = null;
      }
    },
    updateMetadata(): void {
      if (window.navigator.mediaSession) {
        // eslint-disable-next-line no-undef
        window.navigator.mediaSession.metadata = new MediaMetadata({
          title: this.getCurrentItem.Name,
          artist: this.getCurrentItem?.AlbumArtist
            ? this.getCurrentItem.AlbumArtist
            : '',
          album: this.getCurrentItem?.Album ? this.getCurrentItem.Album : '',
          artwork: [
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 96
                }) || '',
              sizes: '96x96'
            },
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 128
                }) || '',
              sizes: '128x128'
            },
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 192
                }) || '',
              sizes: '192x192'
            },
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 256
                }) || '',
              sizes: '256x256'
            },
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 384
                }) || '',
              sizes: '384x384'
            },
            {
              src:
                this.getImageUrlForElement(ImageType.Primary, {
                  item: this.getCurrentItem,
                  maxWidth: 512
                }) || '',
              sizes: '512x512'
            }
          ]
        });
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

.osd-top,
.osd-bottom {
  width: 100%;
  padding: 8px;
}

.osd-bottom > div,
.osd-top > div {
  max-width: calc(100vh * 1.77 - 2vh);
  margin: auto;
}

.osd-top {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 10em
    env(safe-area-inset-left);
  background: linear-gradient(
    180deg,
    rgba(16, 16, 16, 0.75) 0%,
    rgba(16, 16, 16, 0) 100%
  );
}

.osd-bottom {
  padding: 10em env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
  background: linear-gradient(
    0deg,
    rgba(16, 16, 16, 0.75) 0%,
    rgba(16, 16, 16, 0) 100%
  );
}
</style>
