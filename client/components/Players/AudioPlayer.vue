<template>
  <div>
    <audio
      v-for="i in 3"
      :key="`audioPlayer-${i}`"
      ref="audioPlayer"
      @timeupdate="onAudioProgressThrottled"
      @pause="onAudioPause"
      @play="onPlay"
      @ended="onAudioStopped"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { stringify } from 'qs';
import throttle from 'lodash/throttle';
// @ts-expect-error - This module doesn't have typings
import muxjs from 'mux.js';
import { mapActions, mapGetters, mapState } from 'vuex';
import {
  BaseItemDto,
  MediaSourceInfo,
  RepeatMode
} from '@jellyfin/client-axios';
import findKey from 'lodash/findKey';
import timeUtils from '~/mixins/timeUtils';
import imageHelper from '~/mixins/imageHelper';
import { AppState } from '~/store';

interface PlaybackInfo {
  url: string;
  playSessionId?: string;
  mediaSource: MediaSourceInfo;
}

interface ItemPlaybackInfo {
  [key: string]: PlaybackInfo;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    muxjs: any;
  }
}

interface LoadedPlayers {
  [key: number]: string;
}

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      playbackInfos: {} as ItemPlaybackInfo,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shakaInstances: [] as any[],
      playerIndex: 0,
      loadedPlayers: {} as LoadedPlayers,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapState('playbackManager', [
      'currentTime',
      'currentVolume',
      'currentItemIndex',
      'repeatMode',
      'queue'
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentShakaPlayer(): any {
      return this.shakaInstances[this.playerIndex];
    },
    players(): HTMLAudioElement[] {
      return this.$refs.audioPlayer as HTMLAudioElement[];
    },
    currentPlayer(): HTMLAudioElement {
      return (this.$refs.audioPlayer as Element[])?.[
        this.playerIndex
      ] as HTMLAudioElement;
    }
  },
  watch: {
    currentItemIndex: {
      immediate: true,
      async handler(): Promise<void> {
        let info = this.playbackInfos[this.getCurrentItem.Id];

        if (!Object.keys(this.playbackInfos).length && !info) {
          const fetchedInfo = await this.getPlaybackInfo(this.getCurrentItem);

          if (fetchedInfo) {
            info = fetchedInfo;
            this.playbackInfos[this.getCurrentItem.Id] = info;
            await this.loadPlayer(this.currentShakaPlayer, info.url);
            await this.currentPlayer.play();
            // TODO: This should be done directly in playbackManager
            this.setMediaSource({ mediaSource: info.mediaSource });

            if (info.playSessionId) {
              this.setPlaySessionId({ id: info.playSessionId });
            }
          } else {
            this.onPlayerError();
          }
        } else {
          // TODO: PlaybackManager should also store the stream links for each item in the state, so we don't need the
          // playbackInfo dictionary
          this.currentPlayer.pause();

          const playerIndexForItem = parseInt(
            findKey(this.loadedPlayers, (value: string) => {
              return value === this.getCurrentItem.Id;
            }) as string
          );

          if (!info) {
            const fetchedInfo = await this.getPlaybackInfo(this.getCurrentItem);

            if (fetchedInfo) {
              info = fetchedInfo;
              this.playbackInfos[this.getCurrentItem.Id] = info;
            } else {
              this.onPlayerError();
              throw new Error('Error while fetching PlaybackInfo');
            }
          }

          if (!isNaN(playerIndexForItem)) {
            this.playerIndex = playerIndexForItem;
          } else {
            await this.loadPlayer(this.currentShakaPlayer, info.url);
            this.loadedPlayers[this.playerIndex] = this.getCurrentItem.Id;
          }

          await this.currentPlayer.play();
          delete this.loadedPlayers[this.playerIndex];

          this.setMediaSource({ mediaSource: info.mediaSource });

          if (info.playSessionId) {
            this.setPlaySessionId({ id: info.playSessionId });
          }
        }

        const loadedIds = Object.values(this.loadedPlayers);
        const loadedIndexes = Object.keys(this.loadedPlayers);
        const availablePlayers = this.shakaInstances.filter((player) => {
          const index = this.shakaInstances.indexOf(player);

          return index !== this.playerIndex && !(index in loadedIndexes);
        });
        let loop = 0;

        while (
          this.players.length - 1 > loadedIds.length - 1 &&
          availablePlayers.length
        ) {
          const item = this.queue[this.currentItemIndex + loop + 1] as
            | BaseItemDto
            | undefined;

          if (item && item.Id) {
            let info;

            if (this.playbackInfos[item.Id]) {
              info = this.playbackInfos[item.Id];
            } else {
              info = await this.getPlaybackInfo(item);

              if (info) {
                this.playbackInfos[item.Id] = info;
              } else {
                this.onPlayerError();
                throw new Error('Error while fetching PlaybackInfo');
              }
            }

            if (
              !(item.Id in loadedIds) &&
              !(this.getCurrentItem.Id in loadedIds)
            ) {
              const player = availablePlayers.pop();

              await this.loadPlayer(player, info.url);
              this.loadedPlayers[this.shakaInstances.indexOf(player)] = item.Id;
            }
          } else {
            break;
          }

          loop++;
        }
      }
    }
  },
  async mounted() {
    try {
      const { default: shaka } = await import(
        // @ts-expect-error - This module doesn't have typings
        'shaka-player/dist/shaka-player.compiled'
      );

      window.muxjs = muxjs;
      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        for (const player of this.players) {
          const instance = new shaka.Player(player);

          // Register player events
          instance.addEventListener('error', this.onPlayerError);
          this.shakaInstances.push(instance);
        }
        // Subscribe to Vuex actions

        this.unsubscribe = this.$store.subscribe(
          async (mutation, _state: AppState) => {
            switch (mutation.type) {
              case 'playbackManager/PAUSE_PLAYBACK':
                if (this.currentPlayer) {
                  this.currentPlayer.pause();
                }

                break;
              case 'playbackManager/UNPAUSE_PLAYBACK':
                if (this.currentPlayer) {
                  await this.currentPlayer.play();
                }

                break;
              case 'playbackManager/CHANGE_CURRENT_TIME':
                if (this.currentPlayer) {
                  this.currentPlayer.currentTime = this.currentTime;
                }

                break;
              case 'playbackManager/SET_VOLUME':
                if (this.players) {
                  for (const player of this.players) {
                    player.volume = this.currentVolume / 100;
                  }
                }

                break;
              case 'playbackManager/SET_REPEAT_MODE':
                if (this.players) {
                  for (const player of this.players) {
                    if (this.repeatMode === RepeatMode.RepeatOne) {
                      player.loop = true;
                    } else {
                      player.loop = false;
                    }
                  }
                }
            }
          }
        );
      } else {
        this.$nuxt.error({
          message: this.$t('browserNotSupported')
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
    window.muxjs = undefined;
    // Report that the playback is stopping
    this.stop();
    this.unsubscribe();

    for (const shaka of this.shakaInstances) {
      shaka.removeEventListener('error', this.onPlayerError);
      shaka.unload();
      shaka.destroy();
    }
  },
  methods: {
    ...mapActions('playbackManager', [
      'pause',
      'unpause',
      'setNextTrack',
      'setMediaSource',
      'setCurrentTime',
      'setPlaySessionId',
      'stop'
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async loadPlayer(shakaInstance: any, url: string): Promise<void> {
      try {
        await shakaInstance.load(url);
      } catch {}
      // Errors are catched by Shaka's event handler
    },
    async getPlaybackInfo(
      item: BaseItemDto | null
    ): Promise<PlaybackInfo | null> {
      if (item) {
        const info = {} as PlaybackInfo;

        // progress: false disables the progress bar while switching between tracks
        const playbackInfo = (
          await this.$api.mediaInfo.getPostedPlaybackInfo(
            {
              itemId: item.Id || '',
              userId: this.$auth.user?.Id,
              playbackInfoDto: { DeviceProfile: this.$playbackProfile }
            },
            { progress: false }
          )
        ).data;

        if (playbackInfo.PlaySessionId) {
          info.playSessionId = playbackInfo.PlaySessionId;
        }

        let mediaSource;

        if (playbackInfo.MediaSources) {
          mediaSource = playbackInfo.MediaSources[0];
          info.mediaSource = mediaSource;
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

          info.url = `${this.$axios.defaults.baseURL}/Audio/${mediaSource.Id}/stream.${mediaSource.Container}?${params}`;

          return info;
        } else if (
          mediaSource.SupportsTranscoding &&
          mediaSource.TranscodingUrl
        ) {
          info.url = this.$axios.defaults.baseURL + mediaSource.TranscodingUrl;

          return info;
        }
      }

      return null;
    },
    onPlay(_event?: Event): void {
      this.unpause();
    },
    onAudioProgressThrottled: throttle(function (_event?: Event) {
      // @ts-expect-error - TypeScript is confusing the typings with lodash's
      this.onAudioProgress(_event);
    }, 500),
    onAudioProgress(event: Event): void {
      if (this.currentPlayer && event.target === this.currentPlayer) {
        const currentTime = this.currentPlayer.currentTime;

        this.setCurrentTime({ time: currentTime });
      }
    },
    onAudioPause(event: Event): void {
      if (event.target === this.currentPlayer) {
        this.onAudioProgress(event);
        this.pause();
      }
    },
    onAudioStopped(event: Event): void {
      if (event.target === this.currentPlayer) {
        this.onAudioProgress(event);
        this.setNextTrack();
      }
    },
    onPlayerError(event?: ErrorEvent): void {
      this.$emit('error', event);
    }
  }
});
</script>
