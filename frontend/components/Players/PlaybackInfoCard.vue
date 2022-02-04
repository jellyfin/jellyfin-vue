<template>
  <v-container
    v-if="sessionInfo"
    class="playback-data-dialog pointer-events-none pa-lg-6"
  >
    <v-row>
      <v-col cols="12" md="6" lg="4" xl="3">
        <v-card class="mt-12 pb-6">
          <v-card-title class="pb-2">
            {{ $t('playbackInfo.name') }}
            <v-spacer />
            <v-btn
              class="pointer-events-all"
              icon
              @click="$emit('close-playback-data')"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="py-0">
            <div v-if="getPlayMethod" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playbackInfo.playMethod.name')"
              />
              <div>{{ getPlayMethod }}</div>
            </div>
            <div v-if="getStreamType" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playbackInfo.streamType.name')"
              />
              <div>{{ getStreamType }}</div>
            </div>
          </v-card-text>

          <v-card-title v-if="playerStats" class="py-2">
            {{ $t('playerInfo.name') }}
          </v-card-title>
          <v-card-text v-if="playerStats" class="py-0">
            <div v-if="playerStats.width && playerStats.height" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playerInfo.videoResolution.name')"
              />
              <div>
                {{
                  $t('playerInfo.videoResolution.value', {
                    width: playerStats.width,
                    height: playerStats.height
                  })
                }}
              </div>
            </div>
            <div
              v-if="videoDimensions.width && videoDimensions.height"
              class="d-flex"
            >
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playerInfo.playbackResolution.name')"
              />
              <div>
                {{ $t('playerInfo.videoResolution.value', videoDimensions) }}
              </div>
            </div>
            <div v-if="!isNaN(playerStats.decodedFrames)" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playerInfo.decodedFrames.name')"
              />
              <div>{{ playerStats.decodedFrames }}</div>
            </div>
            <div v-if="!isNaN(playerStats.corruptedFrames)" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playerInfo.droppedFrames.name')"
              />
              <div>{{ playerStats.droppedFrames }}</div>
            </div>
            <div v-if="!isNaN(playerStats.corruptedFrames)" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('playerInfo.corruptedFrames.name')"
              />
              <div>{{ playerStats.corruptedFrames }}</div>
            </div>
          </v-card-text>

          <v-card-title class="py-2">
            {{ $t('mediaInfo.name') }}
          </v-card-title>
          <v-card-text class="py-0">
            <div v-if="mediaContainer" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.container.name')"
              />
              <div>
                {{ mediaContainer }}
              </div>
            </div>
            <div v-if="mediaVideoCodec" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.videoCodec.name')"
              />
              <div>
                {{ mediaVideoCodec }}
              </div>
            </div>
            <div v-if="mediaAudioCodec" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.audioCodec.name')"
              />
              <div>
                {{ mediaAudioCodec }}
              </div>
            </div>
            <div v-if="mediaSubtitleCodec" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.subtitleCodec.name')"
              />
              <div>
                {{ mediaSubtitleCodec }}
              </div>
            </div>
            <div v-if="mediaAudioChannels" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.audioChannels.name')"
              />
              <div>
                {{ mediaAudioChannels }}
              </div>
            </div>
            <div v-if="mediaTotalBitrate" class="d-flex">
              <div
                class="font-weight-bold mr-2"
                v-text="$t('mediaInfo.bitrate.name')"
              />
              <div>
                {{ mediaTotalBitrate }}
              </div>
            </div>
          </v-card-text>

          <v-card-title v-if="isTranscoding" class="py-2">
            {{ $t('transcodingInfo.name') }}
          </v-card-title>
          <v-card-text class="py-0">
            <div
              v-if="
                isTranscoding &&
                sessionInfo.TranscodingInfo &&
                sessionInfo.TranscodingInfo.TranscodeReasons.length > 0
              "
              class="d-flex"
            >
              <div
                class="font-weight-bold mr-2"
                v-text="
                  $tc(
                    'transcodingInfo.transcodingReason.name',
                    sessionInfo.TranscodingInfo.TranscodeReasons.length
                  )
                "
              />
              <div class="d-flex flex-column">
                <div
                  v-for="(reason, index) in sessionInfo.TranscodingInfo
                    .TranscodeReasons"
                  :key="index"
                >
                  {{
                    $t(
                      `transcodingInfo.transcodingReason.reasons.${camelCase(
                        reason
                      )}`
                    )
                  }}
                </div>
              </div>
            </div>
            <div
              v-if="
                sessionInfo.TranscodingInfo &&
                sessionInfo.TranscodingInfo.Framerate
              "
              class="d-flex"
            >
              <div
                class="font-weight-bold mr-2"
                v-text="$t('transcodingInfo.transcodingFramerate.name')"
              />
              <div>
                {{
                  $t('transcodingInfo.transcodingFramerate.value', {
                    value: sessionInfo.TranscodingInfo.Framerate
                  })
                }}
              </div>
            </div>
            <div
              v-if="
                sessionInfo.TranscodingInfo &&
                sessionInfo.TranscodingInfo.CompletionPercentage
              "
              class="d-flex flex-column"
            >
              <div class="d-flex">
                <div
                  class="font-weight-bold mr-2"
                  v-text="$t('transcodingInfo.transcodingProgress')"
                />
                <div>
                  {{
                    sessionInfo.TranscodingInfo.CompletionPercentage.toFixed(
                      1
                    ) + '%'
                  }}
                </div>
              </div>
              <v-progress-linear
                class="d-inline-block mt-2"
                :value="
                  sessionInfo.TranscodingInfo.CompletionPercentage.toFixed(1)
                "
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { SessionInfo } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapGetters, mapState } from 'vuex';
import camelCase from 'lodash/camelCase';

export default Vue.extend({
  data() {
    return {
      updateSessionInterval: null as number | null,
      sessionInfo: null as SessionInfo | null,
      playerStats: {},
      videoDimensions: { width: 0, height: 0 }
    };
  },
  computed: {
    ...mapState('deviceProfile', ['deviceId']),
    ...mapState('playbackManager', ['currentMediaSource']),
    ...mapGetters('playbackManager', [
      'getCurrentVideoTrack',
      'getCurrentAudioTrack',
      'getCurrentSubtitleTrack'
    ]),
    isTranscoding(): boolean {
      return !!(
        this.sessionInfo?.PlayState?.PlayMethod === 'Transcode' ||
        this.sessionInfo?.TranscodingInfo
      );
    },
    getStreamType(): string {
      if (window.player?.getAssetUri()) {
        if (window.player.getAssetUri().includes('.m3u8')) {
          return this.$t('playbackInfo.streamType.hls');
        } else if (window.player.getAssetUri().includes('.mpd')) {
          return this.$t('playbackInfo.streamType.dash');
        } else {
          return this.$t('playbackInfo.streamType.video');
        }
      }

      return this.$t('playbackInfo.streamType.unknown');
    },
    getPlayMethod(): string {
      if (this.sessionInfo?.PlayState?.PlayMethod === 'Transcode') {
        return this.$t('playbackInfo.playMethod.transcode');
      } else if (this.sessionInfo?.PlayState?.PlayMethod === 'DirectStream') {
        return this.$t('playbackInfo.playMethod.remux');
      } else if (this.sessionInfo?.PlayState?.PlayMethod === 'DirectPlay') {
        return this.$t('playbackInfo.playMethod.direct');
      }

      return '';
    },
    mediaContainer(): string | null | undefined {
      if (
        this.sessionInfo?.TranscodingInfo?.Container &&
        this.sessionInfo.TranscodingInfo.Container !==
          this.sessionInfo?.NowPlayingItem?.Container
      ) {
        return `${this.sessionInfo?.NowPlayingItem?.Container} ➞ ${this.sessionInfo?.TranscodingInfo?.Container}`;
      }

      return this.sessionInfo?.NowPlayingItem?.Container;
    },
    mediaVideoCodec(): string | null | undefined {
      if (this.getCurrentVideoTrack) {
        if (
          (this.sessionInfo?.TranscodingInfo?.VideoCodec &&
            this.getCurrentVideoTrack.Codec !==
              this.sessionInfo.TranscodingInfo.VideoCodec) ||
          !this.sessionInfo?.TranscodingInfo?.IsAudioDirect
        ) {
          return `${this.getCurrentVideoTrack.Codec} ➞ ${this.sessionInfo?.TranscodingInfo?.VideoCodec}`;
        }

        return this.getCurrentVideoTrack.Codec;
      }

      return null;
    },
    mediaAudioCodec(): string | null | undefined {
      if (this.getCurrentAudioTrack) {
        if (
          (this.sessionInfo?.TranscodingInfo?.AudioCodec &&
            this.getCurrentAudioTrack?.Codec !==
              this.sessionInfo?.TranscodingInfo?.AudioCodec) ||
          !this.sessionInfo?.TranscodingInfo?.IsAudioDirect
        ) {
          return `${this.getCurrentAudioTrack.Codec} ➞ ${this.sessionInfo?.TranscodingInfo?.AudioCodec}`;
        }

        return this.getCurrentAudioTrack.Codec;
      }

      return null;
    },
    mediaSubtitleCodec(): string | null | undefined {
      return this.getCurrentSubtitleTrack?.Codec;
    },
    mediaAudioChannels(): string | null | undefined {
      if (this.getCurrentAudioTrack) {
        if (
          this.sessionInfo?.TranscodingInfo?.AudioChannels &&
          this.getCurrentAudioTrack?.Channels !==
            this.sessionInfo?.TranscodingInfo?.AudioChannels
        ) {
          return `${this.getCurrentAudioTrack.Channels} ➞ ${this.sessionInfo?.TranscodingInfo?.AudioChannels}`;
        }

        return this.getCurrentAudioTrack?.Channels;
      }

      return null;
    },
    mediaTotalBitrate(): string | null | undefined {
      if (
        this.sessionInfo?.TranscodingInfo?.Bitrate &&
        this.currentMediaSource?.Bitrate &&
        this.sessionInfo.TranscodingInfo.Bitrate !==
          this.currentMediaSource.Bitrate
      ) {
        return `${this.getDisplayBitrate(
          this.currentMediaSource.Bitrate
        )} ➞ ${this.getDisplayBitrate(
          this.sessionInfo?.TranscodingInfo?.Bitrate
        )}`;
      } else if (this.currentMediaSource?.Bitrate) {
        return this.getDisplayBitrate(this.currentMediaSource.Bitrate);
      }

      return null;
    }
  },
  beforeMount() {
    this.updateSession();
    this.updateSessionInterval = window.setInterval(() => {
      this.updateSession();
    }, 10000);
  },
  beforeDestroy() {
    if (this.updateSessionInterval !== null) {
      window.clearInterval(this.updateSessionInterval);
    }
  },
  methods: {
    camelCase,
    getDisplayBitrate(bitrate: number): string {
      if (bitrate > 1000000) {
        return this.$t('units.bitrate.mbps', {
          value: (bitrate / 1000000).toFixed(1)
        });
      } else {
        return this.$t('units.bitrate.kbps', {
          value: Math.floor(bitrate / 1000)
        });
      }
    },
    async updateSession(): Promise<void> {
      this.sessionInfo = (
        await this.$api.session.getSessions({
          deviceId: this.deviceId
        })
      ).data?.[0];

      this.playerStats = window.player.getStats();

      // Compute the displayed video's size
      const videoRatio =
        window.player.getMediaElement().videoWidth /
        window.player.getMediaElement().videoHeight;
      let width = window.player.getMediaElement().offsetWidth;
      let height = window.player.getMediaElement().offsetHeight;

      const elementRatio = width / height;

      // If the video element is short and wide
      if (elementRatio > videoRatio) {
        width = height * videoRatio;
      } else {
        height = width / videoRatio;
      }

      this.videoDimensions = {
        width: Math.floor(width),
        height: Math.floor(height)
      };
    }
  }
});
</script>
