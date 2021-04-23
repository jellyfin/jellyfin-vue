<template>
  <v-container fill-height fluid class="pa-0 justify-center">
    <video
      ref="videoPlayer"
      :poster="poster.url"
      autoplay
      :playsinline="$browser.isMobile() && $browser.isApple()"
      @timeupdate="onVideoProgressThrottled"
      @pause="onVideoPause"
      @play="onPlay"
      @ended="onVideoStopped"
    />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { stringify } from 'qs';
import throttle from 'lodash/throttle';
// @ts-expect-error - This module doesn't have typings
import muxjs from 'mux.js';
import { mapActions, mapGetters, mapState } from 'vuex';
import { PlaybackInfoResponse, RepeatMode } from '@jellyfin/client-axios';
import { AppState } from '~/store';
import timeUtils from '~/mixins/timeUtils';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
  }
}

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      playbackInfo: {} as PlaybackInfoResponse,
      source: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ui: null as any,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapState('playbackManager', ['currentTime', 'lastProgressUpdate']),
    ...mapState('deviceProfile', ['deviceId']),
    ...mapState('user', ['accessToken']),
    poster(): ImageUrlInfo {
      return this.getImageInfo(this.getCurrentItem, { preferBackdrop: true });
    }
  },
  watch: {
    getCurrentItem(): void {
      this.getPlaybackUrl();
    },
    async source(newSource): Promise<void> {
      if (this.player) {
        try {
          await this.player.load(newSource, this.currentTime);
        } catch (e) {
          // No need to actually process the error here, the error handler will do this for us
        }
      }
    }
  },
  async mounted() {
    try {
      const { default: shaka } = await import(
        // @ts-expect-error - This module doesn't have typings
        'shaka-player/dist/shaka-player.compiled'
      );

      this.getPlaybackUrl();

      window.muxjs = muxjs;
      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        this.player = new shaka.Player(this.$refs.videoPlayer);

        // Register player events
        this.player.addEventListener('error', this.onPlayerError);
        // Subscribe to Vuex actions
        this.unsubscribe = this.$store.subscribe(
          (mutation, _state: AppState) => {
            switch (mutation.type) {
              case 'playbackManager/PAUSE_PLAYBACK':
                if (this.$refs.videoPlayer) {
                  (this.$refs.videoPlayer as HTMLVideoElement).pause();
                }

                break;
              case 'playbackManager/UNPAUSE_PLAYBACK':
                if (this.$refs.videoPlayer) {
                  (this.$refs.videoPlayer as HTMLVideoElement).play();
                }

                break;
              case 'playbackManager/CHANGE_CURRENT_TIME':
                if (this.$refs.videoPlayer && mutation?.payload?.time) {
                  (this.$refs.videoPlayer as HTMLVideoElement).currentTime =
                    mutation?.payload?.time;
                }

                break;
              case 'playbackManager/SET_REPEAT_MODE':
                if (this.$refs.videoPlayer) {
                  if (mutation?.payload?.mode === RepeatMode.RepeatOne) {
                    (this.$refs.videoPlayer as HTMLVideoElement).loop = true;
                  } else {
                    (this.$refs.videoPlayer as HTMLVideoElement).loop = false;
                  }
                }
            }
          }
        );
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
        });
      }
    } catch (error) {
      this.$nuxt.error({
        statusCode: 404,
        message: error
      });
    }
  },
  beforeDestroy() {
    if (this.player) {
      window.muxjs = undefined;
      this.onVideoStopped(); // Report that the playback is stopping
      this.player.removeEventListener('error', this.onPlayerError);
      this.player.unload();
      this.player.destroy();
    }

    this.unsubscribe();
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('playbackManager', [
      'unpause',
      'pause',
      'setNextTrack',
      'setMediaSource',
      'setCurrentTime',
      'setPlaySessionId',
      'setLastProgressUpdate'
    ]),
    async getPlaybackUrl(): Promise<void> {
      if (this.getCurrentItem) {
        this.playbackInfo = (
          await this.$api.mediaInfo.getPostedPlaybackInfo({
            itemId: this.getCurrentItem?.Id || '',
            userId: this.$auth.user?.Id,
            playbackInfoDto: { DeviceProfile: this.$playbackProfile }
          })
        ).data;

        this.setPlaySessionId({ id: this.playbackInfo.PlaySessionId });

        let mediaSource;

        if (this.playbackInfo?.MediaSources) {
          mediaSource = this.playbackInfo.MediaSources[0];
          this.setMediaSource({ mediaSource });
        } else {
          throw new Error("This item can't be played.");
        }

        if (mediaSource.SupportsDirectStream) {
          const directOptions: Record<
            string,
            string | boolean | undefined | null
          > = {
            Static: true,
            mediaSourceId: mediaSource.Id,
            deviceId: this.deviceId,
            api_key: this.accessToken
          };

          if (mediaSource.ETag) {
            directOptions.Tag = mediaSource.ETag;
          }

          if (mediaSource.LiveStreamId) {
            directOptions.LiveStreamId = mediaSource.LiveStreamId;
          }

          const params = stringify(directOptions);

          this.source = `${this.$axios.defaults.baseURL}/Videos/${mediaSource.Id}/stream.${mediaSource.Container}?${params}`;
        } else if (
          mediaSource.SupportsTranscoding &&
          mediaSource.TranscodingUrl
        ) {
          this.source =
            this.$axios.defaults.baseURL + mediaSource.TranscodingUrl;
        }
      }
    },
    onPlay(_event?: Event): void {
      this.unpause();
    },
    onVideoProgressThrottled: throttle(function (_event?: Event) {
      // @ts-expect-error - TypeScript confuses the context with lodash's throttle typings
      this.onVideoProgress(_event);
    }, 500),
    onVideoProgress(_event?: Event): void {
      if (this.$refs.videoPlayer) {
        const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
      }
    },
    onVideoPause(_event?: Event): void {
      if (this.$refs.videoPlayer) {
        const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
        this.pause();
      }
    },
    onVideoStopped(_event?: Event): void {
      if (this.$refs.videoPlayer) {
        const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
        this.setNextTrack();
      }
    },
    onPlayerError(event: ErrorEvent): void {
      this.$emit('error', event);
    },
    togglePictureInPicture(): void {
      // @ts-expect-error - `requestPictureInPicture` does not exist in relevant types
      (this.$refs.videoPlayer as HTMLVideoElement).requestPictureInPicture();
    }
  }
});
</script>

<style scoped>
.shaka-video-container,
video {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
  height: 100%;
}
</style>
