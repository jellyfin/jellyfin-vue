<template>
  <audio
    ref="audioPlayer"
    :poster="poster"
    autoplay
    @timeupdate="onAudioProgress"
    @pause="onAudioPause"
    @play="onAudioProgress"
    @ended="onAudioStopped"
  ></audio>
</template>

<script lang="ts">
import Vue from 'vue';
import { stringify } from 'qs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shaka from 'shaka-player/dist/shaka-player.compiled';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import muxjs from 'mux.js';
import { mapActions, mapGetters, mapState } from 'vuex';
import { ImageType, PlaybackInfoResponse } from '@jellyfin/client-axios';
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
      player: null as any
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapState('playbackManager', [
      'lastProgressUpdate',
      'currentTime',
      'currentVolume'
    ]),
    poster(): string {
      return this.getImageUrlForElement(ImageType.Backdrop, {
        itemId:
          this.getCurrentItem?.ParentBackdropItemId ||
          this.getCurrentItem?.SeriesId ||
          this.getCurrentItem?.Id
      });
    }
  },
  watch: {
    getCurrentItem() {
      this.getPlaybackUrl();
    },
    async source(newSource) {
      if (this.player) {
        try {
          await this.player.load(newSource);
        } catch (e) {
          // No need to actually process the error here, the error handler will do this for us
        }
      }
    }
  },
  mounted() {
    try {
      this.getPlaybackUrl();

      window.muxjs = muxjs;
      shaka.polyfill.installAll();
      if (shaka.Player.isBrowserSupported()) {
        this.player = new shaka.Player(this.$refs.audioPlayer);
        // Register player events
        this.player.addEventListener('error', this.onPlayerError);
        // Subscribe to Vuex actions
        this.$store.subscribe((mutation, _state: AppState) => {
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
            case 'playbackManager/RESET_CURRENT_TIME':
              if (this.$refs.audioPlayer) {
                (this.$refs.audioPlayer as HTMLAudioElement).currentTime = 0;
              }
              break;
            case 'playbackManager/CHANGE_CURRENT_TIME':
              if (this.$refs.audioPlayer) {
                (this.$refs
                  .audioPlayer as HTMLAudioElement).currentTime = this.currentTime;
              }
              break;
            case 'playbackManager/SET_VOLUME':
              console.warn(this.currentVolume);
              if (this.$refs.audioPlayer) {
                (this.$refs.audioPlayer as HTMLAudioElement).volume =
                  this.currentVolume / 100;
              }
          }
        });
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
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('playbackManager', [
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
            userId: this.$auth.user.Id,
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
            deviceId: this.$store.state.deviceProfile.deviceId,
            api_key: this.$store.state.user.accessToken
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
