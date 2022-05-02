<template>
  <component
    :is="mediaElement"
    ref="shakaPlayer"
    :poster="poster.url"
    autoplay
    crossorigin="anonymous"
    :playsinline="$browser.isMobile() && $browser.isApple()"
    @timeupdate="onProgress"
    @pause="onPause"
    @play="onPlay"
    @ended="onEnd"
    @waiting="onWaiting"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import { stringify } from 'qs';
import isNil from 'lodash/isNil';
// @ts-expect-error - This module doesn't have typings
import muxjs from 'mux.js';
import { mapStores } from 'pinia';
import { PlaybackInfoResponse } from '@jellyfin/client-axios';
import shaka from 'shaka-player/dist/shaka-player.compiled';
import {
  authStore,
  deviceProfileStore,
  playbackManagerStore,
  PlaybackStatus
} from '~/store';
import { RepeatMode } from '~/store/playbackManager';
import timeUtils from '~/mixins/timeUtils';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
    player: shaka.Player | undefined;
  }
}

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      playbackInfo: {} as PlaybackInfoResponse,
      source: '',
      player: null as shaka.Player | null,
      audioContext: null as AudioContext | null,
      audioSource: null as MediaElementAudioSourceNode | null,
      gainNode: null as GainNode | null
    };
  },
  computed: {
    ...mapStores(authStore, deviceProfileStore, playbackManagerStore),
    poster(): ImageUrlInfo | string {
      if (
        this.playbackManager.getCurrentlyPlayingMediaType === 'Video' &&
        !isNil(this.playbackManager.getCurrentItem)
      ) {
        return this.getImageInfo(this.playbackManager.getCurrentItem, {
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
    }
  },
  watch: {
    'playbackManager.getCurrentItem.Id': {
      immediate: true,
      async handler(): Promise<void> {
        this.playbackManager.setBuffering();
        await this.getPlaybackUrl();

        if (this.$refs.shakaPlayer) {
          (this.$refs.shakaPlayer as HTMLMediaElement).play();
        }
      }
    },
    'playbackManager.status': {
      immediate: true,
      handler(): void {
        if (this.$refs.shakaPlayer) {
          switch (this.playbackManager.status) {
            case PlaybackStatus.Playing:
              (this.$refs.shakaPlayer as HTMLMediaElement).play();
              break;
            case PlaybackStatus.Paused:
              (this.$refs.shakaPlayer as HTMLMediaElement).pause();
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
        if (this.$refs.shakaPlayer) {
          if (this.playbackManager.repeatMode === RepeatMode.RepeatOne) {
            (this.$refs.shakaPlayer as HTMLMediaElement).loop = true;
          } else {
            (this.$refs.shakaPlayer as HTMLMediaElement).loop = false;
          }
        }
      }
    }
  },
  mounted() {
    try {
      // Mux.js needs to be globally available before Shaka is loaded, in order for MPEG2 TS transmuxing to work.
      window.muxjs = muxjs;

      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        // We use a global for ease of debugging and to fetch data from the playback information popup
        window.player = new shaka.Player(
          this.$refs.shakaPlayer as HTMLMediaElement
        );
        this.player = window.player;

        // Create WebAudio context and nodes for added processing
        this.audioContext = new AudioContext();
        this.audioSource = this.audioContext.createMediaElementSource(
          this.$refs.shakaPlayer as HTMLMediaElement
        );
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1;
        this.audioSource.connect(this.gainNode);

        this.gainNode.connect(this.audioContext.destination);

        this.updateVolume();

        // Register player events
        this.player.addEventListener('error', this.onPlayerError);
        // Subscribe to Store actions
        this.playbackManager.$onAction(({ name, after }) => {
          after(() => {
            if (name === 'changeCurrentTime') {
              if (this.$refs.shakaPlayer) {
                (this.$refs.shakaPlayer as HTMLMediaElement).currentTime =
                  this.playbackManager.currentTime || 0;
              }
            }
          });
        });
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
    if (this.player) {
      this.playbackManager.stop();
      this.player.removeEventListener('error', this.onPlayerError);
      this.player.unload();
      this.player.destroy();

      if (this.audioContext) {
        this.audioContext.close();
      }
    }

    window.muxjs = undefined;
    window.player = undefined;
  },
  methods: {
    async getPlaybackUrl(): Promise<void> {
      if (this.playbackManager.getCurrentItem && this.player) {
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

        this.player.load(this.source);
      }
    },
    onPause(): void {
      if (this.$refs.shakaPlayer) {
        const currentTime = (this.$refs.shakaPlayer as HTMLMediaElement)
          .currentTime;

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

      if (this.$refs.shakaPlayer) {
        const currentTime = (this.$refs.shakaPlayer as HTMLMediaElement)
          .currentTime;

        this.playbackManager.setCurrentTime(currentTime);
      }
    },
    onEnd(): void {
      if (this.$refs.shakaPlayer) {
        const currentTime = (this.$refs.shakaPlayer as HTMLMediaElement)
          .currentTime;

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
      (this.$refs.shakaPlayer as HTMLMediaElement).requestPictureInPicture();
    },
    updateVolume(): void {
      if (this.$refs.shakaPlayer && this.gainNode) {
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
.shaka-video-container,
video {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
  height: 100%;
}
</style>
