<template>
  <div
    class="'video-container'"
    :class="{ 'video-container--stretched': stretch }"
  >
    <component
      :is="mediaElement"
      ref="shakaPlayer"
      :poster="poster.url"
      autoplay
      crossorigin="anonymous"
      playsinline
      :loop="isLooping"
      @timeupdate="onProgress"
      @pause="onPause"
      @play="onPlay"
      @ended="onEnd"
      @waiting="onWaiting"
    >
      <track
        v-if="subtitleTrack && !isAssSubtitle"
        kind="subtitles"
        default
        :label="subtitleTrack.label"
        :srcLang="subtitleTrack.srcLang"
        :src="$axios.defaults.baseURL + subtitleTrack.src"
      />
    </component>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import isNil from 'lodash/isNil';
// @ts-expect-error - This module doesn't have typings
import muxjs from 'mux.js';
// @ts-expect-error - This module doesn't have typings
import shaka from 'shaka-player/dist/shaka-player.compiled';
// @ts-expect-error - No types for libass
import SubtitlesOctopus from 'libass-wasm';
// @ts-expect-error - No types for libass
import SubtitlesOctopusWorker from 'libass-wasm/dist/js/subtitles-octopus-worker.js';
// @ts-expect-error - No types for libass
import SubtitlesOctopusWorkerLegacy from 'libass-wasm/dist/js/subtitles-octopus-worker-legacy.js';
import 'libass-wasm/dist/js/subtitles-octopus-worker.data';
import 'libass-wasm/dist/js/subtitles-octopus-worker-legacy.data';
import 'libass-wasm/dist/js/subtitles-octopus-worker-legacy.js.mem';
import 'libass-wasm/dist/js/subtitles-octopus-worker.wasm';
import { mapStores } from 'pinia';
import {
  PlaybackInfoResponse,
  SubtitleDeliveryMethod
} from '@jellyfin/client-axios';

import {
  authStore,
  deviceProfileStore,
  playbackManagerStore,
  PlaybackStatus,
  PlaybackTrack
} from '~/store';
import { RepeatMode } from '~/store/playbackManager';
import { getImageInfo, ImageUrlInfo } from '~/utils/images';
import { ticksToMs } from '~/utils/time';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
    player: shaka.Player | undefined;
  }
}

export default Vue.extend({
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
      shaka: null as shaka.Player | null,
      player: undefined as HTMLMediaElement | undefined,
      audioContext: null as AudioContext | null,
      gainNode: null as GainNode | null,
      octopus: undefined as SubtitlesOctopus | undefined,
      subtitleTrack: undefined as PlaybackTrack | undefined,
      restartTime: undefined as number | undefined
    };
  },
  computed: {
    ...mapStores(authStore, deviceProfileStore, playbackManagerStore),
    poster(): ImageUrlInfo | string {
      if (
        this.playbackManager.getCurrentlyPlayingMediaType === 'Video' &&
        !isNil(this.playbackManager.getCurrentItem)
      ) {
        return getImageInfo(this.playbackManager.getCurrentItem, {
          preferBackdrop: true
        });
      } else {
        return '';
      }
    },
    mediaElement(): string {
      if (this.playbackManager.getCurrentlyPlayingMediaType === 'Audio') {
        return 'audio';
      } else if (
        this.playbackManager.getCurrentlyPlayingMediaType === 'Video'
      ) {
        return 'video';
      } else {
        return '';
      }
    },
    isLooping(): boolean {
      return this.playbackManager.repeatMode === RepeatMode.RepeatOne;
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
    },
    isAssSubtitle(): boolean {
      return (
        (
          this.playbackManager
            .getCurrentItemAssParsedSubtitleTracks as PlaybackTrack[]
        ).findIndex(
          (el) =>
            this.subtitleTrack && el.srcIndex === this.subtitleTrack.srcIndex
        ) !== -1
      );
    }
  },
  watch: {
    'playbackManager.getCurrentItem.Id': {
      async handler(): Promise<void> {
        this.playbackManager.setBuffering();
        await this.getPlaybackUrl();
        this.startPlayback();
      }
    },
    'playbackManager.status': {
      handler(): void {
        if (this.player) {
          switch (this.playbackManager.status) {
            case PlaybackStatus.Playing:
              this.player.play();
              break;
            case PlaybackStatus.Paused:
              this.player.pause();
              break;
          }
        }
      }
    },
    'playbackManager.currentVolume': {
      handler(): void {
        this.updateVolume();
      }
    },
    'playbackManager.isMuted': {
      handler(): void {
        this.updateVolume();
      }
    },
    'playbackManager.currentSubtitleStreamIndex'(): void {
      this.changeSubtitle(this.playbackManager.currentSubtitleStreamIndex || 0);
    },
    async 'playbackManager.currentAudioStreamIndex'(): Promise<void> {
      if (this.player) {
        this.restartTime = this.player.currentTime;
        await this.getPlaybackUrl();
      }
    }
  },
  async mounted() {
    try {
      this.playbackManager.setBuffering();
      this.player = this.$refs.shakaPlayer as HTMLMediaElement;
      // Mux.js needs to be globally available before Shaka is loaded, in order for MPEG2 TS transmuxing to work.
      window.muxjs = muxjs;

      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        // We use a global for ease of debugging and to fetch data from the playback information popup
        window.player = new shaka.Player(this.player);
        this.shaka = window.player;

        // Create WebAudio context and nodes for added processing
        this.audioContext = new AudioContext();

        const audioSource = this.audioContext.createMediaElementSource(
          this.player
        );

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1;
        audioSource.connect(this.gainNode);

        this.gainNode.connect(this.audioContext.destination);

        // Register player events
        this.shaka.addEventListener('error', this.onPlayerError);
        // Subscribe to Store actions
        this.playbackManager.$onAction(({ name, after }) => {
          after(() => {
            if (name === 'changeCurrentTime') {
              if (this.player) {
                this.player.currentTime = this.playbackManager.currentTime || 0;
              }
            }
          });
        });

        await this.getPlaybackUrl();
        this.startPlayback();
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
        });
      }
    } catch (error) {
      this.$nuxt.error({
        statusCode: 404,
        message: error as string
      });
    }
  },
  beforeDestroy() {
    this.playbackManager.stop();

    if (this.shaka) {
      this.shaka.removeEventListener('error', this.onPlayerError);
      this.shaka.unload();
      this.shaka.destroy();
    }

    if (this.octopus) {
      this.octopus.dispose();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    window.muxjs = undefined;
    window.player = undefined;
  },
  methods: {
    async getPlaybackUrl(): Promise<void> {
      if (this.playbackManager.getCurrentItem && this.shaka) {
        this.playbackInfo = (
          await this.$api.mediaInfo.getPostedPlaybackInfo(
            {
              itemId: this.playbackManager.getCurrentItem?.Id || '',
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

        let mediaSource;

        if (this.playbackInfo?.MediaSources) {
          mediaSource = this.playbackInfo.MediaSources[0];
          this.playbackManager.setMediaSource(mediaSource);
        } else {
          throw new Error("This item can't be played.");
        }

        if (mediaSource.SupportsDirectStream) {
          const directOptions: Record<string, string> = {
            Static: String(true),
            mediaSourceId: String(mediaSource.Id),
            deviceId: this.deviceProfile.deviceId,
            api_key: this.auth.currentUserToken
          };

          if (mediaSource.ETag) {
            directOptions.Tag = mediaSource.ETag;
          }

          if (mediaSource.LiveStreamId) {
            directOptions.LiveStreamId = mediaSource.LiveStreamId;
          }

          const params = new URLSearchParams(directOptions).toString();

          let mediaType = 'Videos';

          if (this.playbackManager.getCurrentlyPlayingMediaType === 'Audio') {
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
    async changeSubtitle(newsrcIndex: number): Promise<void> {
      // Find new sub
      const newSub = (
        this.playbackManager
          .getCurrentItemParsedSubtitleTracks as PlaybackTrack[]
      ).find((el) => el.srcIndex === newsrcIndex);

      // If we currently have a sub burned in or will have, a change implies to always fetch a new video stream
      if (
        this.player &&
        ((this.subtitleTrack &&
          this.subtitleTrack.type === SubtitleDeliveryMethod.Encode) ||
          (newSub && newSub.type === SubtitleDeliveryMethod.Encode))
      ) {
        // Set the restart time so that the function knows where to restart
        this.restartTime = this.player.currentTime;
        this.subtitleTrack = undefined;
        await this.getPlaybackUrl();

        return;
      }

      /**
       * If the subtitles are not burned in the video, we need to render them in the browser.
       */
      this.subtitleTrack = newSub;

      /**
       * Handle non-encoded subtitles
       */
      this.displayExternalSub();
    },
    displayExternalSub() {
      if (this.player) {
        // Disable octopus
        if (this.octopus) {
          this.octopus.freeTrack();
        }

        /**
         * Nothing else to do if the new subtitle doesn't exist
         */
        if (!this.subtitleTrack) {
          return;
        }

        /**
         * VTT is handled automatically by the track element in this Vue component.
         * Here we just handle ASS subtitles (rendered by JavascriptSubtitleOctopus)
         */
        if (this.isAssSubtitle) {
          if (!this.octopus) {
            this.octopus = new SubtitlesOctopus({
              video: this.player,
              workerUrl: SubtitlesOctopusWorker,
              legacyWorkerUrl: SubtitlesOctopusWorkerLegacy,
              subUrl:
                this.$axios.defaults.baseURL + (this.subtitleTrack.src || ''),
              blendRender: true
            });
          } else {
            this.octopus.setTrackByUrl(
              this.$axios.defaults.baseURL + (this.subtitleTrack.src || '')
            );
          }
        }
      }
    },
    startPlayback(): void {
      this.shaka.load(this.source);

      if (this.player) {
        this.player.currentTime =
          this.restartTime ||
          ticksToMs(
            this.playbackManager.getCurrentItem?.UserData
              ?.PlaybackPositionTicks || 0
          ) / 1000;
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
        this.player.addEventListener('loadeddata', () => {
          this.displayExternalSub();
        });

        this.updateVolume();
      }
    },
    onPause(): void {
      if (this.player) {
        const currentTime = this.player.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
        this.playbackManager.pause();
      }
    },
    onPlay(): void {
      this.playbackManager.unpause();
    },
    onProgress(): void {
      if (this.playbackManager.status === PlaybackStatus.Buffering) {
        this.playbackManager.cancelBuffering();
      }

      if (this.player) {
        const currentTime = this.player.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
      }
    },
    onEnd(): void {
      if (this.player) {
        const currentTime = this.player.currentTime;

        this.playbackManager.setCurrentTime(currentTime);
        this.playbackManager.setNextTrack();
      }
    },
    onPlayerError(e: any): void {
      this.$emit('error', e);
    },
    onWaiting(): void {
      this.playbackManager.setBuffering();
    },
    togglePictureInPicture(): void {
      // @ts-expect-error - `requestPictureInPicture` does not exist in relevant types
      this.player.requestPictureInPicture();
    },
    updateVolume(): void {
      if (this.player && this.gainNode) {
        const targetVolume = this.playbackManager.isMuted
          ? 0
          : this.playbackManager.currentVolume;

        this.gainNode.gain.value = Math.pow(targetVolume / 100, 3);
      }
    }
  }
});
</script>

<style scoped>
.video-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-container--stretched {
  position: absolute;
  inset: 0;
}

video {
  width: 100%;
  height: 100%;
}
</style>
