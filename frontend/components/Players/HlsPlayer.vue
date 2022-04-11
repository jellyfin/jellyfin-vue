<template>
  <div>
    <video
      ref="player"
      :class="{ stretch: stretch }"
      :poster="poster.url"
      :muted="playbackManager.isMuted"
      autoplay
      crossorigin="anonymous"
      playsinline
      @timeupdate="onProgress"
      @pause="onPause"
      @play="onPlay"
      @ended="onEnd"
      @waiting="onWaiting"
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
import isNil from 'lodash/isNil';
import { mapStores } from 'pinia';
import {
  PlaybackInfoResponse,
  SubtitleDeliveryMethod
} from '@jellyfin/client-axios';
import { stringify } from 'qs';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { authStore, deviceProfileStore, playbackManagerStore } from '~/store';
import {
  PlaybackStatus,
  PlaybackTrack,
  RepeatMode
} from '~/store/playbackManager';

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
      subtitleTrack: undefined as PlaybackTrack | undefined,
      restartTime: undefined as number | undefined
    };
  },
  computed: {
    ...mapStores(authStore, deviceProfileStore, playbackManagerStore),
    poster(): ImageUrlInfo | string | null {
      if (!isNil(this.playbackManager.getCurrentItem)) {
        return this.getImageInfo(this.playbackManager.getCurrentItem, {
          preferBackdrop: true
        });
      } else {
        return null;
      }
    },
    videoElement(): HTMLVideoElement | undefined {
      return this.$refs.player as HTMLVideoElement | undefined;
    },
    isHls(): boolean {
      const mediaSource = this.playbackManager.currentMediaSource;

      if (
        !isNil(mediaSource) &&
        mediaSource.SupportsTranscoding &&
        mediaSource.TranscodingSubProtocol === 'hls'
      ) {
        return true;
      }

      return false;
    }
  },
  watch: {
    async 'playbackManager.getCurrentItem.Id'(): Promise<void> {
      this.playbackManager.setBuffering();
      await this.getPlaybackUrl();
    },
    'playbackManager.status': {
      immediate: true,
      handler(): void {
        if (this.videoElement) {
          switch (this.playbackManager.status) {
            case PlaybackStatus.Playing:
              this.videoElement.play();
              break;
            case PlaybackStatus.Paused:
              this.videoElement.pause();
              break;
          }
        }
      }
    },
    'playbackManager.currentVolume': {
      immediate: true,
      handler(): void {
        this.updateVolume();
      }
    },
    'playbackManager.isMuted': {
      immediate: true,
      handler(): void {
        this.updateVolume();
      }
    },
    'playbackManager.repeatMode': {
      immediate: true,
      handler(): void {
        if (this.videoElement) {
          if (this.playbackManager.repeatMode === RepeatMode.RepeatOne) {
            this.videoElement.loop = true;
          } else {
            this.videoElement.loop = false;
          }
        }
      }
    },
    'playbackManager.currentSubtitleStreamIndex'(): void {
      this.changeSubtitle(this.playbackManager.currentSubtitleStreamIndex || 0);
    },
    async 'playbackManager.currentAudioStreamIndex'(): Promise<void> {
      if (!isNil(this.videoElement)) {
        this.restartTime = this.videoElement.currentTime;
        await this.getPlaybackUrl();
      }
    },
    source(newSource): void {
      this.destroy();

      const mediaSource = this.playbackManager.currentMediaSource;
      const item = this.playbackManager.getCurrentItem;

      if (!isNil(item) && !isNil(mediaSource) && !isNil(this.videoElement)) {
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
          this.playbackManager
            .getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
        ).find(
          (sub) =>
            sub.srcIndex === this.playbackManager.currentSubtitleStreamIndex
        );

        // If index isn't -1 and there's no sub found, it doesn't exist and we reset it
        if (
          this.playbackManager.currentSubtitleStreamIndex !== -1 &&
          !this.subtitleTrack
        ) {
          this.playbackManager.currentSubtitleStreamIndex = -1;
        }

        // Will display (or not) current external subtitle when start of video is loaded
        this.videoElement.addEventListener('loadeddata', () => {
          this.displayExternalSub(this.subtitleTrack);
        });

        this.updateVolume();

        this.playbackManager.$onAction(({ name, after }) => {
          after(() => {
            if (name === 'changeCurrentTime' && !isNil(this.videoElement)) {
              this.videoElement.currentTime =
                this.playbackManager.currentTime || 0;
            }
          });
        });
      }
    }
  },
  async mounted() {
    await this.getPlaybackUrl();
  },
  beforeDestroy() {
    this.playbackManager.stop();

    this.destroy();
  },
  methods: {
    async getPlaybackUrl(): Promise<void> {
      if (
        this.playbackManager.getCurrentItem &&
        this.playbackManager.getCurrentItem.Id
      ) {
        this.playbackInfo = (
          await this.$api.mediaInfo.getPostedPlaybackInfo(
            {
              itemId: this.playbackManager.getCurrentItem.Id,
              userId: this.auth.currentUserId,
              autoOpenLiveStream: true,
              playbackInfoDto: { DeviceProfile: this.$playbackProfile },
              mediaSourceId: undefined,
              audioStreamIndex: this.playbackManager.currentAudioStreamIndex,
              subtitleStreamIndex:
                this.playbackManager.currentSubtitleStreamIndex
            },
            { progress: false }
          )
        ).data;

        this.playbackManager.setPlaySessionId(
          this.playbackInfo.PlaySessionId || ''
        );

        if (!this.playbackInfo?.MediaSources?.[0]) {
          throw new Error("This item can't be played.");
        }

        const mediaSource = this.playbackInfo.MediaSources[0];

        this.playbackManager.setMediaSource(mediaSource);

        if (mediaSource.SupportsDirectStream) {
          const directOptions: Record<
            string,
            string | boolean | undefined | null
          > = {
            Static: true,
            mediaSourceId: mediaSource.Id,
            deviceId: this.deviceProfile.deviceId,
            api_key: this.auth.currentUserToken
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
        this.playbackManager
          .getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((el) => el.srcIndex === newsrcIndex);

      // If we currently have a sub burned in or will have, a change implies to always fetch a new video stream
      if (
        !isNil(this.videoElement) &&
        ((this.subtitleTrack &&
          this.subtitleTrack.type === SubtitleDeliveryMethod.Encode) ||
          (newSub && newSub.type === SubtitleDeliveryMethod.Encode))
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
      if (!isNil(this.videoElement)) {
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
          this.playbackManager
            .getCurrentItemVttParsedSubtitleTracks as PlaybackTrack[]
        ).findIndex((el) => el.srcIndex === newSub.srcIndex);
        const assIdx = (
          this.playbackManager
            .getCurrentItemAssParsedSubtitleTracks as PlaybackTrack[]
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
      }
    },
    onHlsError(_event: Events.ERROR, data: ErrorData): void {
      if (!this.hls) {
        return;
      }

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
    },
    onPlay(_event?: Event): void {
      this.playbackManager.unpause();
    },
    onProgress(_event?: Event): void {
      if (this.playbackManager.status === PlaybackStatus.Buffering) {
        this.playbackManager.cancelBuffering();
      }

      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
      }
    },
    onPause(): void {
      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
        this.playbackManager.pause();
      }
    },
    onEnd(): void {
      if (this.videoElement) {
        const currentTime = this.videoElement.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
        this.playbackManager.setNextTrack();
      }
    },
    onWaiting(): void {
      this.playbackManager.setBuffering();
    },
    togglePictureInPicture(): void {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else if (
        document.pictureInPictureEnabled &&
        !isNil(this.videoElement)
      ) {
        this.videoElement.requestPictureInPicture();
      }
    },
    toggleNativeFullscreen(): void {
      // @ts-expect-error - `webkitEnterFullscreen` does not exist in relevant type
      if (this.videoElement?.webkitEnterFullscreen) {
        // @ts-expect-error - `webkitEnterFullscreen` does not exist in relevant type
        this.videoElement.webkitEnterFullscreen();
      }
    },
    updateVolume(): void {
      if (!isNil(this.videoElement)) {
        const targetVolume = this.playbackManager.isMuted
          ? 0
          : this.playbackManager.currentVolume;

        this.videoElement.volume = Math.pow(targetVolume / 100, 3);
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
