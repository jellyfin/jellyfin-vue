<template>
  <div>
    <video
      ref="player"
      :class="{ stretch: stretch }"
      :poster="poster.url"
      :muted="isMuted"
      autoplay
      crossorigin="anonymous"
      playsinline
      @timeupdate="onProgressThrottled"
      @pause="onPause"
      @play="onPlay"
      @ended="onStopped"
    />
  </div>
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
import { mapActions, mapGetters, mapState, mapMutations } from 'vuex';
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
  props: {
    stretch: {
      type: Boolean,
      default: false
    }
  },
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
      'getCurrentItemParsedSubtitleTracks',
      'getCurrentItemVttParsedSubtitleTracks',
      'getCurrentItemAssParsedSubtitleTracks'
    ]),
    ...mapState('playbackManager', [
      'isMuted',
      'currentTime',
      'currentVolume',
      'currentMediaSource',
      'currentAudioStreamIndex',
      'currentSubtitleStreamIndex'
    ]),
    ...mapState('deviceProfile', ['deviceId']),
    ...mapState('user', ['accessToken']),
    poster(): ImageUrlInfo | string {
      return this.getImageInfo(this.getCurrentItem, { preferBackdrop: true });
    },
    videoElement(): HTMLVideoElement {
      return this.$refs.player as HTMLVideoElement;
    },
    isHls() {
      const mediaSource = this.currentMediaSource as MediaSourceInfo;

      return (
        mediaSource.SupportsTranscoding &&
        mediaSource.TranscodingSubProtocol === 'hls'
      );
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

      if (
        mediaSource.SupportsDirectPlay ||
        (this.isHls &&
          this.videoElement.canPlayType('application/vnd.apple.mpegurl'))
      ) {
        this.videoElement.src = newSource;
      } else if (Hls.isSupported() && this.isHls) {
        this.hls = new Hls();
        this.hls.on(Hls.Events.ERROR, this.onHlsError);
        this.hls.attachMedia(this.videoElement);
        this.hls.loadSource(newSource);
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
        });

        return;
      }

      this.videoElement.currentTime =
        this.restartTime ||
        this.ticksToMs(item.UserData?.PlaybackPositionTicks || 0) / 1000;
      this.restartTime = undefined;

      this.subtitleTrack = (
        this.getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((sub) => sub.srcIndex === this.currentSubtitleStreamIndex);

      // If index isn't -1 and there's no sub found, it doesn't exist and we reset it
      if (this.currentSubtitleStreamIndex !== -1 && !this.subtitleTrack) {
        this.SET_CURRENT_SUBTITLE_TRACK_INDEX({
          subtitleStreamIndex: -1
        });
      }

      // Will display (or not) current external subtitle when start of video is loaded
      this.videoElement.addEventListener('loadeddata', () => {
        this.displayExternalSub(this.subtitleTrack);
      });

      const updateVolume = (): void => {
        this.videoElement.volume = Math.pow(this.currentVolume / 100, 3);
      };

      updateVolume();

      this.unsubscribe = this.$store.subscribe((mutation, _state: AppState) => {
        switch (mutation.type) {
          case 'playbackManager/PAUSE_PLAYBACK':
            this.videoElement.pause();
            break;
          case 'playbackManager/UNPAUSE_PLAYBACK':
            this.videoElement.play();
            break;
          case 'playbackManager/CHANGE_CURRENT_TIME':
            if (mutation?.payload?.time !== null) {
              this.videoElement.currentTime = mutation?.payload?.time;
            }

            break;
          case 'playbackManager/SET_VOLUME':
            updateVolume();
            break;
          case 'playbackManager/SET_CURRENT_SUBTITLE_TRACK_INDEX':
            if (mutation?.payload?.subtitleStreamIndex !== null) {
              this.changeSubtitle(mutation?.payload?.subtitleStreamIndex);
            }

            break;
          case 'playbackManager/SET_CURRENT_AUDIO_TRACK_INDEX':
            if (mutation?.payload?.audioStreamIndex !== null) {
              // Set the restart time so that the function knows where to restart
              this.restartTime = this.videoElement.currentTime;
              this.getPlaybackUrl();
            }
        }
      });
    }
  },
  mounted() {
    this.getPlaybackUrl();
  },
  beforeDestroy() {
    this.onStopped(); // Report that the playback is stopping

    this.destroy();
  },
  methods: {
    ...mapActions('playbackManager', [
      'pause',
      'unpause',
      'setNextTrack',
      'setMediaSource',
      'setCurrentTime',
      'setPlaySessionId'
    ]),
    ...mapMutations('playbackManager', ['SET_CURRENT_SUBTITLE_TRACK_INDEX']),
    async getPlaybackUrl(): Promise<void> {
      if (this.getCurrentItem && this.getCurrentItem.Id) {
        this.playbackInfo = (
          await this.$api.mediaInfo.getPostedPlaybackInfo(
            {
              itemId: this.getCurrentItem.Id,
              userId: this.$auth.user?.Id,
              autoOpenLiveStream: true,
              playbackInfoDto: { DeviceProfile: this.$playbackProfile },
              mediaSourceId: this.getCurrentItem.Id,
              audioStreamIndex: this.currentAudioStreamIndex,
              subtitleStreamIndex: this.currentSubtitleStreamIndex
            },
            { progress: false }
          )
        ).data;

        this.setPlaySessionId({ id: this.playbackInfo.PlaySessionId });

        if (!this.playbackInfo?.MediaSources?.[0]) {
          throw new Error("This item can't be played.");
        }

        const mediaSource = this.playbackInfo.MediaSources[0];

        this.setMediaSource({ mediaSource });

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
    async changeSubtitle(newsrcIndex: number): Promise<void> {
      // Find new sub
      const newSub = (
        this.getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((el) => el.srcIndex === newsrcIndex);

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
    displayExternalSub(newSub?: PlaybackTrack) {
      // Disable octopus
      if (this.octopus) {
        this.octopus.freeTrack();
      }

      // Disable VTT
      const oldVtt = this.videoElement.getElementsByTagName('track')[0];

      if (oldVtt) {
        this.videoElement.textTracks[0].mode = 'disabled';
        oldVtt.remove();
      }

      // If new sub doesn't exist, we're done here
      if (!newSub) {
        this.subtitleTrack = newSub;

        return;
      }

      // Find the sub in the VTT or ASS subs
      const vttIdx = (
        this.getCurrentItemVttParsedSubtitleTracks as PlaybackTrack[]
      ).findIndex((el) => el.srcIndex === newSub.srcIndex);
      const assIdx = (
        this.getCurrentItemAssParsedSubtitleTracks as PlaybackTrack[]
      ).findIndex((el) => el.srcIndex === newSub.srcIndex);

      if (vttIdx !== -1) {
        // Manually add and remove (when disabling) a <track> tag cause in FF we weren't able to make it reliably work with a v-for and a tracks[index].mode = "showing"
        const newVtt = document.createElement('track');

        newVtt.kind = 'subtitles';
        newVtt.srclang = newSub.srcLang || '';
        newVtt.src = this.$axios.defaults.baseURL + (newSub.src || '');
        this.videoElement.appendChild(newVtt);
        this.videoElement.textTracks[0].mode = 'showing';
        this.subtitleTrack = newSub;
      } else if (assIdx !== -1) {
        if (!this.octopus) {
          this.octopus = new SubtitlesOctopus({
            video: this.videoElement,
            workerUrl: SubtitlesOctopusWorker,
            legacyWorkerUrl: SubtitlesOctopusWorkerLegacy,
            subUrl: this.$axios.defaults.baseURL + (newSub.src || ''),
            blendRender: true
          });
        } else {
          this.octopus.setTrackByUrl(
            this.$axios.defaults.baseURL + (newSub.src || '')
          );
        }

        this.subtitleTrack = newSub;
      }
    },
    onHlsError(_event: Events.ERROR, data: ErrorData): void {
      if (!this.hls) return;

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // try to recover network error
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
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
    },
    togglePictureInPicture(): void {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        this.videoElement.requestPictureInPicture();
      }
    },
    toggleNativeFullscreen(): void {
      // @ts-expect-error - `webkitEnterFullscreen` does not exist in relevant type
      if (this.videoElement?.webkitEnterFullscreen) {
        // @ts-expect-error - `webkitEnterFullscreen` does not exist in relevant type
        this.videoElement.webkitEnterFullscreen();
      }
    }
  }
});
</script>

<style scoped>
/* stylelint-disable-next-line */
::cue {
  background-color: transparent;
  text-shadow: 0.14em 0.14em 0.14em rgba(0, 0, 0, 100%);
  font-family: inherit;
  line-height: normal; /* Restore value. See -webkit-media-text-track-container 'line-height' */
  -webkit-font-smoothing: antialiased;
}

.videoControls,
video {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
}

.stretch {
  width: 100vw !important;
}
</style>
