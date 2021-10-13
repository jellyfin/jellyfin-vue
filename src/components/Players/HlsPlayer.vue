<template>
  <video
    ref="player"
    :poster="poster.url"
    autoplay
    crossorigin="anonymous"
    :playsinline="$browser.isMobile() && $browser.isApple()"
    @timeupdate="onProgressThrottled"
    @pause="onPause"
    @play="onPlay"
    @ended="onStopped"
  />
</template>

<script lang="ts">
import Vue from 'vue';
// @ts-expect-error No typings in the old version we're using
import Hls, { ErrorData, Events } from 'hls.js';
import throttle from 'lodash/throttle';
import { mapActions, mapGetters, mapState } from 'vuex';
import {
  BaseItemDto,
  MediaSourceInfo,
  PlaybackInfoResponse
} from '@jellyfin/client-axios';
import { stringify } from 'qs';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { AppState } from '~/store';

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      playbackInfo: {} as PlaybackInfoResponse,
      source: '',
      hls: undefined as Hls | undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getCurrentlyPlayingMediaType',
      'getCurrentItemVttSubtitleTracks'
    ]),
    ...mapState('playbackManager', [
      'lastProgressUpdate',
      'currentTime',
      'currentVolume',
      'currentMediaSource',
      'currentVideoStreamIndex',
      'currentAudioStreamIndex',
      'currentSubtitleStreamIndex',
      'isMinimized'
    ]),
    ...mapState('deviceProfile', ['deviceId']),
    ...mapState('user', ['accessToken']),
    poster(): ImageUrlInfo | string {
      if (this.getCurrentlyPlayingMediaType === 'Video') {
        return this.getImageInfo(this.getCurrentItem, { preferBackdrop: true });
      } else {
        return '';
      }
    }
  },
  watch: {
    getCurrentItem(newItem, oldItem): void {
      if (newItem !== oldItem) this.getPlaybackUrl();
    },
    source(newSource): void {
      const mediaSource = this.currentMediaSource as MediaSourceInfo;
      const item = this.getCurrentItem as BaseItemDto;
      const startPosition =
        this.ticksToMs(item.UserData?.PlaybackPositionTicks || 0) / 1000;

      if (
        Hls.isSupported() &&
        mediaSource.SupportsTranscoding &&
        mediaSource.TranscodingSubProtocol === 'hls'
      ) {
        console.log('hls');
        this.hls = new Hls({
          startPosition
        });
        this.hls.loadSource(newSource);
        this.hls.attachMedia(this.$refs.player as HTMLVideoElement);
        this.hls.on(Hls.Events.ERROR, this.onHlsError);
      } else if (mediaSource.SupportsDirectPlay) {
        console.log('direct play');
        (this.$refs.player as HTMLVideoElement).src = newSource;
        (this.$refs.player as HTMLVideoElement).currentTime = startPosition;
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
        });

        return;
      }

      window.player = this.$refs.player;

      // if (
      //   this.$refs.player &&
      //   item.UserData?.PlaybackPositionTicks &&
      //   item.UserData.PlaybackPositionTicks !== 0
      // ) {
      //   (this.$refs.player as HTMLMediaElement).currentTime =
      //     this.ticksToMs(item.UserData.PlaybackPositionTicks) / 1000;
      // }

      this.unsubscribe = this.$store.subscribe((mutation, _state: AppState) => {
        switch (mutation.type) {
          case 'playbackManager/PAUSE_PLAYBACK':
            if (this.$refs.player)
              (this.$refs.player as HTMLMediaElement).pause();

            break;
          case 'playbackManager/UNPAUSE_PLAYBACK':
            if (this.$refs.player)
              (this.$refs.player as HTMLMediaElement).play();

            break;
          case 'playbackManager/CHANGE_CURRENT_TIME':
            if (this.$refs.player && mutation?.payload?.time !== null) {
              (this.$refs.player as HTMLMediaElement).currentTime =
                mutation?.payload?.time;
            }

            break;

          case 'playbackManager/SET_VOLUME':
            if (this.$refs.player)
              (this.$refs.player as HTMLMediaElement).volume = Math.pow(
                this.currentVolume / 100,
                3
              );

            break;

          // case 'playbackManager/SET_REPEAT_MODE':
          //   if (this.$refs.shakaPlayer) {
          //     if (mutation?.payload?.mode === RepeatMode.RepeatOne) {
          //       (this.$refs.shakaPlayer as HTMLMediaElement).loop = true;
          //     } else {
          //       (this.$refs.shakaPlayer as HTMLMediaElement).loop = false;
          //     }
          //   }
        }
      });
    }
  },
  mounted() {
    this.getPlaybackUrl();
  },
  beforeDestroy() {
    if (this.hls) this.hls.destroy();

    this.unsubscribe();
  },
  methods: {
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
          await this.$api.mediaInfo.getPostedPlaybackInfo(
            {
              itemId: this.getCurrentItem?.Id || '',
              userId: this.$auth.user?.Id,
              autoOpenLiveStream: true,
              playbackInfoDto: { DeviceProfile: this.$playbackProfile },
              mediaSourceId: this.currentMediaSource?.Id
                ? this.currentMediaSource.Id
                : undefined,
              audioStreamIndex: this.currentAudioStreamIndex,
              subtitleStreamIndex: this.currentSubtitleStreamIndex
            },
            { progress: false }
          )
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

          let mediaType = 'Videos';

          if (this.getCurrentlyPlayingMediaType === 'Audio') {
            mediaType = 'Audio';
          }

          this.source = `${this.$axios.defaults.baseURL}/${mediaType}/${mediaSource.Id}/stream.${mediaSource.Container}?${params}`;
        } else if (
          mediaSource.SupportsTranscoding &&
          mediaSource.TranscodingUrl
        ) {
          this.source =
            this.$axios.defaults.baseURL + mediaSource.TranscodingUrl;
        }
      }
    },
    onHlsError(_event: Events.ERROR, data: ErrorData): void {
      if (!this.hls) return;

      console.warn('HLS exception');
      console.warn(data);

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // try to recover network error
            console.log('fatal network error encountered, try to recover');
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('fatal media error encountered, try to recover');
            this.hls.recoverMediaError();
            break;
          default:
            // cannot recover
            this.hls.destroy();
            this.$nuxt.error({
              message: this.$t('fatalHlsError')
            });
            break;
        }
      }

      (this.$refs.player as HTMLMediaElement).play();
    },
    onPlay(_event?: Event): void {
      this.unpause();
    },
    onProgressThrottled: throttle(function (_event?: Event) {
      // @ts-expect-error - TypeScript is confusing the typings with lodash's
      this.onProgress(_event);
    }, 500),
    onProgress(_event?: Event): void {
      if (this.$refs.player) {
        const currentTime = (this.$refs.player as HTMLMediaElement).currentTime;

        this.setCurrentTime({ time: currentTime });
      }
    },
    onPause(_event?: Event): void {
      if (this.$refs.player) {
        const currentTime = (this.$refs.player as HTMLMediaElement).currentTime;

        this.setCurrentTime({ time: currentTime });
        this.pause();
      }
    },
    onStopped(_event?: Event): void {
      if (this.$refs.player) {
        const currentTime = (this.$refs.player as HTMLMediaElement).currentTime;

        this.setCurrentTime({ time: currentTime });
        this.setNextTrack();
      }
    }
  }
});
</script>

<style scoped>
.videoControls,
video {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
  height: 100%;
}
</style>
