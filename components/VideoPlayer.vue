<template>
  <v-container fill-height fluid class="pa-0">
    <div ref="videoContainer">
      <video
        ref="videoPlayer"
        :poster="poster"
        autoplay
        @playing="onVideoPlaying"
        @timeupdate="onVideoProgress"
        @pause="onVideoPause"
        @play="onVideoProgress"
        @ended="onVideoStopped"
      ></video>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { stringify } from 'qs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shaka from 'shaka-player/dist/shaka-player.ui';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import muxjs from 'mux.js';
import { mapActions } from 'vuex';
import 'shaka-player/dist/controls.css';
import { PlaybackInfoResponse } from '~/api';
import timeUtils from '~/mixins/timeUtils';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
  }
}

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    item: {
      type: Object,
      required: true
    },
    poster: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      playbackInfo: {} as PlaybackInfoResponse,
      lastProgressUpdate: 0,
      source: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ui: null as any
    };
  },
  watch: {
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
  async mounted() {
    try {
      this.playbackInfo = (
        await this.$api.mediaInfo.getPostedPlaybackInfo({
          itemId: this.$route.params.itemId,
          userId: this.$auth.user.Id,
          playbackInfoDto: { DeviceProfile: this.$playbackProfile }
        })
      ).data;

      let mediaSource;
      if (this.playbackInfo?.MediaSources) {
        mediaSource = this.playbackInfo.MediaSources[0];
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
        this.source = `${this.$axios.defaults.baseURL}/Videos/${mediaSource.Id}/stream.${mediaSource.Container}?${params}`;
      } else if (
        mediaSource.SupportsTranscoding &&
        mediaSource.TranscodingUrl
      ) {
        this.source = this.$axios.defaults.baseURL + mediaSource.TranscodingUrl;
      }
      window.muxjs = muxjs;
      shaka.polyfill.installAll();
      if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        this.player = new shaka.Player(this.$refs.videoPlayer);
        this.ui = new shaka.ui.Overlay(
          this.player,
          this.$refs.videoContainer,
          this.$refs.videoPlayer
        );
        // Register player events
        this.player.addEventListener('error', this.onPlayerError);
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
      this.onVideoStopped(); // Report that the playback is stopping
      this.player.removeEventListener('error', this.onPlayerError);
      this.player.unload();
      this.player.destroy();
    }
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    onVideoPlaying(_event: Event) {
      // TODO: Move to playback manager
      this.$api.playState.reportPlaybackStart(
        {
          playbackStartInfo: {
            CanSeek: true,
            ItemId: this.item.Id,
            PlaySessionId: this.playbackInfo.PlaySessionId,
            MediaSourceId: this.playbackInfo.MediaSources?.[0].Id,
            AudioStreamIndex: 0, // TODO: Don't hardcode this
            SubtitleStreamIndex: 0 // TODO: Don't hardcode this
          }
        },
        { progress: false }
      );

      this.lastProgressUpdate = new Date().getTime();
    },
    onVideoProgress(_event?: Event) {
      // TODO: Move to playback manager
      const now = new Date().getTime();

      if (now - this.lastProgressUpdate > 1000) {
        const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
          .currentTime;

        this.$api.playState.reportPlaybackProgress(
          {
            playbackProgressInfo: {
              ItemId: this.item.Id,
              PlaySessionId: this.playbackInfo.PlaySessionId,
              IsPaused: false,
              PositionTicks: Math.round(this.msToTicks(currentTime * 1000))
            }
          },
          { progress: false }
        );

        this.lastProgressUpdate = new Date().getTime();
      }
    },
    onVideoPause(_event?: Event) {
      // TODO: Move to playback manager
      const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
        .currentTime;

      this.$api.playState.reportPlaybackProgress(
        {
          playbackProgressInfo: {
            ItemId: this.item.Id,
            PlaySessionId: this.playbackInfo.PlaySessionId,
            IsPaused: true,
            PositionTicks: Math.round(this.msToTicks(currentTime * 1000))
          }
        },
        { progress: false }
      );
    },
    onVideoStopped(_event?: Event) {
      // TODO: Move to playback manager
      const currentTime = (this.$refs.videoPlayer as HTMLVideoElement)
        .currentTime;

      this.$api.playState.reportPlaybackStopped(
        {
          playbackStopInfo: {
            ItemId: this.item.Id,
            PlaySessionId: this.playbackInfo.PlaySessionId,
            PositionTicks: this.msToTicks(currentTime * 1000)
          }
        },
        { progress: false }
      );

      this.lastProgressUpdate = 0;

      if (event !== undefined) {
        // We're coming from a real end of playback event, so avoid staying on the video screen after playback
        // TODO: Once in the playback manager, move this to the end of the queue
        this.$router.back();
      }
    },
    onPlayerError(event: Event) {
      this.$emit('error', event);
    }
  }
});
</script>

<style scoped>
video {
  width: 100vw;
  height: 100vh;
}
</style>
