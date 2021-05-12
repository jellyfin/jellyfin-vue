<template>
  <audio
    ref="audioPlayer"
    autoplay
    @timeupdate="onAudioProgressThrottled"
    @pause="onAudioPause"
    @play="onPlay"
    @ended="onAudioStopped"
  />
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
import imageHelper from '~/mixins/imageHelper';

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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapState('playbackManager', [
      'lastProgressUpdate',
      'currentTime',
      'currentVolume'
    ]),
    ...mapState('deviceProfile', ['deviceId']),
    ...mapState('user', ['accessToken'])
  },
  watch: {
    getCurrentItem(): void {
      this.getPlaybackUrl();
    },
    async source(newSource): Promise<void> {
      if (this.player) {
        try {
          await this.player.load(newSource);
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
        this.player = new shaka.Player(this.$refs.audioPlayer);
        // Register player events
        this.player.addEventListener('error', this.onPlayerError);
        // Subscribe to Vuex actions
        this.unsubscribe = this.$store.subscribe(
          (mutation, _state: AppState) => {
            switch (mutation.type) {
              case 'playbackManager/PAUSE_PLAYBACK':
                if (this.$refs.audioPlayer) {
                  (this.$refs.audioPlayer as HTMLAudioElement).pause();
                }

                break;
              case 'playbackManager/UNPAUSE_PLAYBACK':
                if (this.$refs.audioPlayer) {
                  (this.$refs.audioPlayer as HTMLAudioElement).play();
                }

                break;
              case 'playbackManager/CHANGE_CURRENT_TIME':
                if (this.$refs.audioPlayer) {
                  (this.$refs
                    .audioPlayer as HTMLAudioElement).currentTime = this.currentTime;
                }

                break;
              case 'playbackManager/SET_VOLUME':
                if (this.$refs.audioPlayer) {
                  (this.$refs.audioPlayer as HTMLAudioElement).volume =
                    this.currentVolume / 100;
                }

                break;
              case 'playbackManager/SET_REPEAT_MODE':
                if (this.$refs.audioPlayer) {
                  if (mutation?.payload?.mode === RepeatMode.RepeatOne) {
                    (this.$refs.audioPlayer as HTMLAudioElement).loop = true;
                  } else {
                    (this.$refs.audioPlayer as HTMLAudioElement).loop = false;
                  }
                }
            }
          }
        );
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported') as string
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
      this.onAudioStopped(); // Report that the playback is stopping
      this.player.removeEventListener('error', this.onPlayerError);
      this.player.unload();
      this.player.destroy();
    }

    this.unsubscribe();
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('playbackManager', [
      'pause',
      'unpause',
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
            uNKNOWNBASETYPE: { DeviceProfile: this.$playbackProfile }
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

          this.source = `${this.$axios.defaults.baseURL}/Audio/${mediaSource.Id}/stream.${mediaSource.Container}?${params}`;
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
    onAudioProgressThrottled: throttle(function (_event?: Event) {
      // @ts-expect-error - TypeScript is confusing the typings with lodash's
      this.onAudioProgress(_event);
    }, 500),
    onAudioProgress(_event?: Event): void {
      if (this.$refs.audioPlayer) {
        const currentTime = (this.$refs.audioPlayer as HTMLAudioElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
      }
    },
    onAudioPause(_event?: Event): void {
      if (this.$refs.audioPlayer) {
        const currentTime = (this.$refs.audioPlayer as HTMLAudioElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
        this.pause();
      }
    },
    onAudioStopped(_event?: Event): void {
      if (this.$refs.audioPlayer) {
        const currentTime = (this.$refs.audioPlayer as HTMLAudioElement)
          .currentTime;

        this.setCurrentTime({ time: currentTime });
        this.setNextTrack();
      }
    },
    onPlayerError(event: ErrorEvent): void {
      this.$emit('error', event);
    }
  }
});
</script>
