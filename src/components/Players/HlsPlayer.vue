<template>
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
</template>

<script lang="ts">
import Vue from 'vue';
// @ts-expect-error No typings in the old version we're using
import Hls, { ErrorData, Events } from 'hls.js';
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

      if (
        mediaSource.SupportsDirectPlay ||
        (isHls &&
          (this.$refs.player as HTMLVideoElement).canPlayType(
            'application/vnd.apple.mpegurl'
          ))
      ) {
        console.log('direct play (or HLS native on iOS)');
        (this.$refs.player as HTMLVideoElement).src = newSource;
        (this.$refs.player as HTMLVideoElement).currentTime = startPosition;
      } else if (Hls.isSupported() && isHls) {
        console.log('hls');
        this.hls = new Hls({
          startPosition
        });
        this.hls.loadSource(newSource);
        this.hls.attachMedia(this.$refs.player as HTMLVideoElement);
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
      (this.$refs.player as HTMLVideoElement).oncanplay = (_ev): void => {
        this.displayExternalSub(this.subtitleTrack);
      };

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
        this.restartTime = (this.$refs.player as HTMLVideoElement).currentTime;
        await this.getPlaybackUrl();

        return;
      }

      // Manage non-encoded subs
      this.displayExternalSub(newSub);
    },
    displayExternalSub(newSub: PlaybackTrack | undefined) {
      // Disable all VTT subs
      for (
        let i = 0;
        i < this.getCurrentItemVttParsedSubtitleTracks.length;
        ++i
      ) {
        (this.$refs.player as HTMLMediaElement).textTracks[i].mode = 'disabled';
      }

      // Disable octopus
      if (this.octopus) {
        this.octopus.dispose();
        this.octopus = undefined;
      }

      // If new sub doesn't exist, we're done here
      if (!newSub) {
        this.subtitleTrack = newSub;

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
        (this.$refs.player as HTMLMediaElement).textTracks[vttIdx].mode =
          'showing';
        this.subtitleTrack = newSub;
      } else if (assIdx !== -1) {
        this.octopus = new SubtitlesOctopus({
          video: this.$refs.player,
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

      (this.$refs.player as HTMLMediaElement).play();
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
