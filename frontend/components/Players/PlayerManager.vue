<template>
  <div ref="playerContainer">
    <shaka-player
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
      :retain-focus="!isMinimized"
      :content-class="getContentClass()"
      :width="$vuetify.breakpoint.mobile ? '60vw' : '25vw'"
      :value="isPlaying"
    >
      <up-next @change="setUpNextVisible" />
      <v-hover v-slot="{ hover }">
        <v-card class="player-card" width="100%">
          <v-container fill-height fluid class="pa-0 justify-center">
            <hls-player
              ref="videoPlayer"
              :stretch="stretchVideo && !isMinimized"
            />
          </v-container>
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
                  class="absolute-cover pointer-events-none d-flex flex-row justify-center align-center"
                >
                  <v-btn
                    class="pointer-events-all"
                    icon
                    large
                    @click="setPreviousTrack"
                  >
                    <v-icon size="32">mdi-skip-previous</v-icon>
                  </v-btn>
                  <v-btn
                    class="pointer-events-all"
                    icon
                    x-large
                    @click="playPause"
                  >
                    <v-icon size="48">
                      {{ isPaused ? 'mdi-play' : 'mdi-pause' }}
                    </v-icon>
                  </v-btn>
                  <v-btn
                    class="pointer-events-all"
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
            <v-overlay
              v-show="!isMinimized && showFullScreenOverlay && !isUpNextVisible"
              color="transparent"
              absolute
            >
              <div
                class="d-flex flex-column justify-space-between align-center player-overlay"
              >
                <div class="osd-top pt-s pl-s pr-s">
                  <div class="d-flex align-center py-2 px-4">
                    <div class="d-flex">
                      <v-btn icon @click="stopPlayback">
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                      <v-btn icon @click="toggleMinimized">
                        <v-icon>mdi-chevron-down</v-icon>
                      </v-btn>
                    </div>
                    <div class="d-flex ml-auto">
                      <cast-button />
                    </div>
                  </div>
                </div>
                <div class="osd-bottom pb-s pl-s pr-s">
                  <div class="pa-4">
                    <time-slider />
                    <div
                      class="controls-wrapper d-flex align-stretch justify-space-between"
                    >
                      <div
                        v-if="$vuetify.breakpoint.mdAndUp"
                        class="d-flex flex-column align-start justify-center mr-auto video-title"
                      >
                        <template v-if="getCurrentItem.Type === 'Episode'">
                          <span class="mt-1 text-subtitle-1 text-truncate">
                            {{ getCurrentItem.Name }}
                          </span>
                          <span
                            class="text-subtitle-2 text--secondary text-truncate"
                          >
                            {{ getCurrentItem.SeriesName }}
                          </span>
                          <span
                            class="text-subtitle-2 text--secondary text-truncate"
                          >
                            {{
                              $t('seasonEpisode', {
                                seasonNumber: getCurrentItem.ParentIndexNumber,
                                episodeNumber: getCurrentItem.IndexNumber
                              })
                            }}
                          </span>
                        </template>
                        <template v-else>
                          <span>{{ getCurrentItem.Name }}</span>
                        </template>
                      </div>
                      <div
                        class="d-flex player-controls align-center justify-start justify-md-center"
                      >
                        <v-btn icon class="mx-1" @click="setPreviousTrack">
                          <v-icon> mdi-skip-previous </v-icon>
                        </v-btn>
                        <v-btn
                          icon
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
                        <v-btn icon class="mx-1" @click="setNextTrack">
                          <v-icon icon> mdi-skip-next</v-icon>
                        </v-btn>
                      </div>
                      <div class="d-flex aligh-center ml-auto ml-md-0">
                        <volume-slider
                          v-if="$vuetify.breakpoint.smAndUp"
                          class="mr-2"
                        />
                        <queue-button
                          :nudge-top="$vuetify.breakpoint.mdAndUp ? 60 : 30"
                          :close-on-click="true"
                          @input="onMenuOpen($event)"
                        />
                        <subtitle-selection-button
                          v-if="$vuetify.breakpoint.smAndUp"
                          :nudge-top="$vuetify.breakpoint.mdAndUp ? 60 : 30"
                          @input="onMenuOpen($event)"
                        />
                        <playback-settings-button
                          :nudge-top="$vuetify.breakpoint.mdAndUp ? 60 : 30"
                          :stretch-prop="stretchVideo"
                          @input="onMenuOpen($event)"
                          @open-playback-data="playbackData = true"
                          @stretch="stretchVideo = $event"
                        />
                        <v-btn
                          v-if="$features.pictureInPicture"
                          class="align-self-center active-button"
                          icon
                          @click="togglePictureInPicture"
                        >
                          <v-icon>mdi-picture-in-picture-bottom-right</v-icon>
                        </v-btn>
                        <v-btn
                          v-if="$vuetify.breakpoint.smAndUp"
                          class="align-self-center active-button"
                          icon
                          @click="stretchVideo = !stretchVideo"
                        >
                          <v-icon v-if="!stretchVideo">
                            mdi-stretch-to-page-outline
                          </v-icon>
                          <v-icon v-if="stretchVideo">
                            mdi-stretch-to-page
                          </v-icon>
                        </v-btn>
                        <v-btn
                          v-if="$features.fullScreen"
                          class="align-self-center active-button"
                          icon
                          @click="toggleFullScreen"
                        >
                          <v-icon>mdi-fullscreen</v-icon>
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
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import screenfull from 'screenfull';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { AppState } from '~/store';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  mixins: [timeUtils, imageHelper],
  data() {
    return {
      showFullScreenOverlay: false,
      fullScreenOverlayTimer: null as number | null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {},
      keepOpen: false,
      playbackData: false,
      isUpNextVisible: false,
      stretchVideo: true
    };
  },
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getPreviousItem',
      'getNextItem',
      'getCurrentlyPlayingMediaType'
    ]),
    ...mapState('clientSettings', ['darkMode']),
    ...mapState('playbackManager', ['status', 'isMinimized', 'currentTime']),
    isPlaying(): boolean {
      return this.status !== PlaybackStatus.Stopped;
    },
    isPaused(): boolean {
      return this.status === PlaybackStatus.Paused;
    }
  },
  watch: {
    isMinimized(value): void {
      if (value) {
        document.documentElement.classList.remove('overflow-hidden');
      } else {
        document.documentElement.classList.add('overflow-hidden');
      }
    },
    isPlaying(value) {
      if (value && !this.isMinimized) {
        document.documentElement.classList.add('overflow-hidden');
      } else {
        document.documentElement.classList.remove('overflow-hidden');
      }
    }
  },
  mounted() {
    document.addEventListener('mousemove', this.handleMouseMove);

    this.addMediaHandlers();

    this.unsubscribe = this.$store.subscribe((mutation, state: AppState) => {
      switch (mutation.type) {
        case 'playbackManager/TOGGLE_MINIMIZE':
          if (state.playbackManager.isMinimized === true) {
            window.removeEventListener('keydown', this.handleKeyPress);
          } else if (state.playbackManager.isMinimized === false) {
            window.addEventListener('keydown', this.handleKeyPress);
          }

          break;
      }
    });
  },
  beforeDestroy() {
    if (this.fullScreenOverlayTimer) {
      clearTimeout(this.fullScreenOverlayTimer);
    }

    document.removeEventListener('mousemove', this.handleMouseMove);
    this.removeMediaHandlers();
    this.unsubscribe();
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
    setUpNextVisible(isVisible: boolean): void {
      this.isUpNextVisible = isVisible;
    },
    getOsdTimeoutDuration(): number {
      // If we're on mobile, the OSD timer must be longer, to account for the lack of pointer movement
      if (window.matchMedia('(pointer:fine)').matches) {
        return 3000;
      } else {
        return 7500;
      }
    },
    setFullscreenTimeout(): void {
      this.fullScreenOverlayTimer = window.setTimeout(() => {
        if (!this.isMinimized) {
          this.showFullScreenOverlay = false;

          document.body.classList.add('hide-pointer');

          this.fullScreenOverlayTimer = null;
        }
      }, this.getOsdTimeoutDuration());
    },
    handleMouseMove(): void {
      if (
        this.isPlaying &&
        this.getCurrentlyPlayingMediaType === 'Video' &&
        !this.isMinimized
      ) {
        if (this.fullScreenOverlayTimer) {
          window.clearTimeout(this.fullScreenOverlayTimer);
        }

        this.showFullScreenOverlay = true;

        document.body.classList.remove('hide-pointer');

        if (!this.keepOpen) {
          this.setFullscreenTimeout();
        }
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
      if (this.fullScreenOverlayTimer) {
        window.clearTimeout(this.fullScreenOverlayTimer);
      }

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
            // @ts-expect-error - MediaSession is still a draft. Thus, it doesn't contain proper typings.
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
            // @ts-expect-error - MediaSession is still a draft. Thus, it doesn't contain proper typings.
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
                this.getImageInfo(this.getCurrentItem, {
                  width: 96
                }).url || '',
              sizes: '96x96'
            },
            {
              src:
                this.getImageInfo(this.getCurrentItem, {
                  width: 128
                }).url || '',
              sizes: '128x128'
            },
            {
              src:
                this.getImageInfo(this.getCurrentItem, {
                  width: 192
                }).url || '',
              sizes: '192x192'
            },
            {
              src:
                this.getImageInfo(this.getCurrentItem, {
                  width: 256
                }).url || '',
              sizes: '256x256'
            },
            {
              src:
                this.getImageInfo(this.getCurrentItem, {
                  width: 384
                }).url || '',
              sizes: '384x384'
            },
            {
              src:
                this.getImageInfo(this.getCurrentItem, {
                  width: 512
                }).url || '',
              sizes: '512x512'
            }
          ]
        });
      }
    },
    togglePictureInPicture(): void {
      // @ts-expect-error - `togglePictureInPicture` does not exist in relevant types
      this.$refs.videoPlayer.togglePictureInPicture();
    },
    toggleFullScreen(): void {
      if (this.$browser.isApple() && this.$browser.isMobile()) {
        // Use native video fullscreen on iPhone to hide the bottom home bar
        // @ts-expect-error - `toggleNativeFullscreen` does not exist in relevant types
        this.$refs.videoPlayer.toggleNativeFullscreen();
      } else if (this.$refs.playerContainer && screenfull.isEnabled) {
        screenfull.toggle((this.$refs.playerContainer as Vue).$el);
      }
    },
    onMenuOpen(value: boolean): void {
      this.keepOpen = value;

      if (value && this.fullScreenOverlayTimer) {
        clearTimeout(this.fullScreenOverlayTimer);
        this.fullScreenOverlayTimer = null;
      } else if (!value) {
        this.setFullscreenTimeout();
      }
    }
  }
});
</script>

<style lang="scss">
// These don't work when scoped, for some reason.

.player {
  overflow-y: hidden;
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

<style lang="scss" scoped>
.playback-data-dialog {
  position: absolute;
  z-index: 999;
}

.v-card.player-card {
  background-color: black !important;
}

.controls-wrapper {
  position: relative;
}

/* stylelint-disable-next-line */
.v-overlay::v-deep .v-overlay__content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.player-overlay {
  height: 100%;
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
  padding-bottom: 5em;
  background: linear-gradient(
    to bottom,
    hsla(0, 0%, 0%, 0.75) 0%,
    hsla(0, 0%, 0%, 0.74) 8.1%,
    hsla(0, 0%, 0%, 0.714) 15.5%,
    hsla(0, 0%, 0%, 0.672) 22.5%,
    hsla(0, 0%, 0%, 0.618) 29%,
    hsla(0, 0%, 0%, 0.556) 35.3%,
    hsla(0, 0%, 0%, 0.486) 41.2%,
    hsla(0, 0%, 0%, 0.412) 47.1%,
    hsla(0, 0%, 0%, 0.338) 52.9%,
    hsla(0, 0%, 0%, 0.264) 58.8%,
    hsla(0, 0%, 0%, 0.194) 64.7%,
    hsla(0, 0%, 0%, 0.132) 71%,
    hsla(0, 0%, 0%, 0.078) 77.5%,
    hsla(0, 0%, 0%, 0.036) 84.5%,
    hsla(0, 0%, 0%, 0.01) 91.9%,
    hsla(0, 0%, 0%, 0) 100%
  );
}

.osd-bottom {
  padding-top: 6em;
  background: linear-gradient(
    to top,
    hsla(0, 0%, 0%, 0.75) 0%,
    hsla(0, 0%, 0%, 0.74) 8.1%,
    hsla(0, 0%, 0%, 0.714) 15.5%,
    hsla(0, 0%, 0%, 0.672) 22.5%,
    hsla(0, 0%, 0%, 0.618) 29%,
    hsla(0, 0%, 0%, 0.556) 35.3%,
    hsla(0, 0%, 0%, 0.486) 41.2%,
    hsla(0, 0%, 0%, 0.412) 47.1%,
    hsla(0, 0%, 0%, 0.338) 52.9%,
    hsla(0, 0%, 0%, 0.264) 58.8%,
    hsla(0, 0%, 0%, 0.194) 64.7%,
    hsla(0, 0%, 0%, 0.132) 71%,
    hsla(0, 0%, 0%, 0.078) 77.5%,
    hsla(0, 0%, 0%, 0.036) 84.5%,
    hsla(0, 0%, 0%, 0.01) 91.9%,
    hsla(0, 0%, 0%, 0) 100%
  );
}

.player-controls {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.video-title {
  max-width: 40vw;
  height: 6em;
}

// HACK: https://github.com/vuetifyjs/vuetify/issues/8436.
// https://vuetifyjs.com/en/api/v-btn/#retain-focus-on-click prop was added
// but it seems we're using a prop combination that it's incompatible with it: NaN;

// SO link: https://stackoverflow.com/questions/57830767/is-it-default-for-vuetify-to-keep-active-state-on-buttons-after-click-how-do-yo/57831256#57831256
.active-button:focus::before {
  opacity: 0 !important;
}
</style>
