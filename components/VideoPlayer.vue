<template>
  <v-container fill-height fluid class="pa-0">
    <div ref="videoContainer">
      <video ref="videoPlayer" :poster="poster" autoplay></video>
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
import 'shaka-player/dist/controls.css';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
  }
}

export default Vue.extend({
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
      source: '',
      player: null as any,
      ui: null as any
    };
  },
  watch: {
    async source(newSource) {
      if (this.player) {
        try {
          await this.player.load(newSource);
        } catch (e) {
          console.error('Error code', e.code, 'object', e);
        }
      }
    }
  },
  async mounted() {
    try {
      const response = await this.$api.mediaInfo.getPostedPlaybackInfo({
        itemId: this.$route.params.itemId,
        userId: this.$auth.user.Id,
        deviceProfileDto: {
          DeviceProfile: this.$playbackProfile
        }
      });

      let mediaSource;
      if (response?.data?.MediaSources) {
        mediaSource = response.data.MediaSources[0];
      } else {
        throw new Error("This item can't be played.");
      }

      if (mediaSource.SupportsDirectStream) {
        const directOptions: Record<string, any> = {
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
      this.player.unload();
      this.player.destroy();
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
