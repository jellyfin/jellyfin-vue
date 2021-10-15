<template>
  <div>
    <video
      ref="player"
      :poster="poster.url"
      autoplay
      crossorigin="anonymous"
      playsinline
      @timeupdate="onProgressThrottled"
      @pause="onPause"
      @play="onPlay"
      @ended="onStopped"
    >
      <track
        v-for="track in getCurrentItemVttParsedSubtitleTracks"
        :key="track.jfIdx"
        kind="subtitles"
        :label="track.label"
        :srcLang="track.srcLang"
        :src="$axios.defaults.baseURL + track.src"
      />
    </video>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// @ts-expect-error No typings in the old version we're using
import Hls, { ErrorData, Events } from 'hls.js';
import Plyr from 'plyr';
// @ts-expect-error - No types for libass
import SubtitlesOctopus from 'libass-wasm';
// @ts-expect-error - No types for libass
import SubtitlesOctopusWorker from 'libass-wasm/dist/js/subtitles-octopus-worker.js';
// @ts-expect-error - No types for libass
import SubtitlesOctopusWorkerLegacy from 'libass-wasm/dist/js/subtitles-octopus-worker-legacy.js';
import throttle from 'lodash/throttle';
import { mapActions, mapGetters, mapState } from 'vuex';
import {
  BaseItemDto,
  MediaSourceInfo,
  PlaybackInfoResponse,
  SubtitleDeliveryMethod
} from '@jellyfin/client-axios';
import { stringify } from 'qs';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { AppState } from '~/store';
import { PlaybackTrack } from '~/store/playbackManager';

// Using requires so those aren't treeshaked and loaded by the webpack file loader as static assets
require('libass-wasm/dist/js/subtitles-octopus-worker.data');
require('libass-wasm/dist/js/subtitles-octopus-worker-legacy.data');
require('libass-wasm/dist/js/subtitles-octopus-worker-legacy.js.mem');
require('libass-wasm/dist/js/subtitles-octopus-worker.wasm');

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      playbackInfo: {} as PlaybackInfoResponse,
      source: '',
      plyr: undefined as Plyr | undefined,
      hls: undefined as Hls | undefined,
      octopus: undefined as SubtitlesOctopus | undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {},
      subtitleTrack: undefined as PlaybackTrack | undefined,
      restartTime: undefined as number | undefined
    };
  },
  computed: {
    ...mapGetters('playbackManager', [
      'getCurrentItem',
      'getCurrentlyPlayingMediaType',
      'getCurrentItemParsedSubtitleTracks',
      'getCurrentItemVttParsedSubtitleTracks',
      'getCurrentItemAssParsedSubtitleTracks'
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
    },
    videoElement(): HTMLVideoElement {
      return this.$refs.player as HTMLVideoElement;
    }
  },
  watch: {
    getCurrentItem(newItem, oldItem): void {
      if (newItem !== oldItem) this.getPlaybackUrl();
    },
    source(newSource): void {
      this.destroy();

      const mediaSource = this.currentMediaSource as MediaSourceInfo;
      const item = this.getCurrentItem as BaseItemDto;
      const startPosition =
        this.restartTime ||
        this.ticksToMs(item.UserData?.PlaybackPositionTicks || 0) / 1000;

      this.restartTime = undefined;

      const isHls =
        mediaSource.SupportsTranscoding &&
        mediaSource.TranscodingSubProtocol === 'hls';

      if (!this.plyr) {
        this.plyr = new Plyr(this.videoElement, {
          controls: [],
          keyboard: { global: true }
        });
      }

      if (
        mediaSource.SupportsDirectPlay ||
        (isHls &&
          this.videoElement.canPlayType('application/vnd.apple.mpegurl'))
      ) {
        console.log('direct play (or HLS native on iOS)');
        this.videoElement.src = newSource;
        this.videoElement.currentTime = startPosition;
      } else if (Hls.isSupported() && isHls) {
        console.log('hls');
        this.hls = new Hls({
          startPosition
        });
        this.hls.loadSource(newSource);
        this.hls.attachMedia(this.videoElement);
        this.hls.on(Hls.Events.ERROR, this.onHlsError);
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
        });

        return;
      }

      window.player = this.$refs.player;

      this.subtitleTrack = (
        this.getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((sub) => sub.jfIdx === this.currentSubtitleStreamIndex);

      // Will display (or not) external subs
      this.videoElement.oncanplay = (_ev): void => {
        this.displayExternalSub(this.subtitleTrack);
      };

      this.unsubscribe = this.$store.subscribe((mutation, _state: AppState) => {
        switch (mutation.type) {
          case 'playbackManager/PAUSE_PLAYBACK':
            if (this.videoElement) this.videoElement.pause();

            break;
          case 'playbackManager/UNPAUSE_PLAYBACK':
            if (this.videoElement) this.videoElement.play();

            break;
          case 'playbackManager/CHANGE_CURRENT_TIME':
            if (this.videoElement && mutation?.payload?.time !== null) {
              this.videoElement.currentTime = mutation?.payload?.time;
            }

            break;

          case 'playbackManager/SET_VOLUME':
            if (this.videoElement)
              this.videoElement.volume = Math.pow(this.currentVolume / 100, 3);

            break;

          case 'playbackManager/SET_CURRENT_SUBTITLE_TRACK_INDEX':
            if (mutation?.payload?.subtitleStreamIndex !== null) {
              this.changeSubtitle(mutation?.payload?.subtitleStreamIndex);
            }

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
    this.destroy();
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
              mediaSourceId: this.getCurrentItem?.Id,
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
    async changeSubtitle(newJfIdx: number): Promise<void> {
      // Find new sub
      const newSub = (
        this.getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((el) => el.jfIdx === newJfIdx);

      // If we currently have a sub burned in or will have, a change implies to always fetch a new video stream
      if (
        (this.subtitleTrack &&
          this.subtitleTrack.type === SubtitleDeliveryMethod.Encode) ||
        (newSub && newSub.type === SubtitleDeliveryMethod.Encode)
      ) {
        // Set the restart time so that the function knows where to restart
        this.restartTime = this.videoElement.currentTime;
        await this.getPlaybackUrl();

        return;
      }

      // Manage non-encoded subs
      this.displayExternalSub(newSub);
    },
    displayExternalSub(newSub: PlaybackTrack | undefined) {
      // Disable octopus
      if (this.octopus) {
        this.octopus.dispose();
        this.octopus = undefined;
      }

      // We don't always set the Plyr current track to -1 cause it bugs the subs if you then change it back to a new value
      // This causes a bug when some tracks have the same srcLang
      // https://github.com/sampotts/plyr/issues/2330

      // If new sub doesn't exist, we're done here
      if (!newSub) {
        this.subtitleTrack = newSub;

        if (this.plyr) this.plyr.currentTrack = -1;

        return;
      }

      // Find the sub in the VTT or ASS subs
      const vttIdx = (
        this.getCurrentItemVttParsedSubtitleTracks as PlaybackTrack[]
      ).findIndex((el) => el.jfIdx === newSub.jfIdx);
      const assIdx = (
        this.getCurrentItemAssParsedSubtitleTracks as PlaybackTrack[]
      ).findIndex((el) => el.jfIdx === newSub.jfIdx);

      if (vttIdx !== -1) {
        if (this.plyr) this.plyr.currentTrack = vttIdx;

        this.subtitleTrack = newSub;
      } else if (assIdx !== -1) {
        if (this.plyr) this.plyr.currentTrack = -1;

        this.octopus = new SubtitlesOctopus({
          video: this.videoElement,
          workerUrl: SubtitlesOctopusWorker,
          legacyWorkerUrl: SubtitlesOctopusWorkerLegacy,
          subUrl: this.$axios.defaults.baseURL + (newSub.src || ''),
          blendRender: true
        });
        this.subtitleTrack = newSub;
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

      this.videoElement.play();
    },
    destroy() {
      if (this.hls) {
        this.hls.destroy();
        this.hls = undefined;
      }

      if (this.octopus) {
        this.octopus.dispose();
        this.octopus = undefined;
      }

      if (this.plyr) {
        this.plyr.destroy();
        this.plyr = undefined;
      }

      this.unsubscribe();
    },
    onPlay(_event?: Event): void {
      this.unpause();
    },
    onProgressThrottled: throttle(function (_event?: Event) {
      // @ts-expect-error - TypeScript is confusing the typings with lodash's
      this.onProgress(_event);
    }, 500),
    onProgress(_event?: Event): void {
      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

        this.setCurrentTime({ time: currentTime });
      }
    },
    onPause(_event?: Event): void {
      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

        this.setCurrentTime({ time: currentTime });
        this.pause();
      }
    },
    onStopped(_event?: Event): void {
      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

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

<style lang="scss">
// Plyr 3.6.4 is used for now as their latest CSS (3.6.8) isn't working with Nuxt's postcss 7
// It should work in postcss 8
@import '~plyr/src/sass/plyr.scss';
</style>
