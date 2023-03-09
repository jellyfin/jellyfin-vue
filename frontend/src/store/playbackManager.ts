/**
 * This store handles the state of the playback
 *
 * It must be used in an agnostic way to cover both local and remote playback.
 * If you want to handle the state of the local player element, use playerElement store instead.
 */
import { reactive, ref, watch } from 'vue';
import { shuffle, isNil, cloneDeep } from 'lodash-es';
import {
  BaseItemDto,
  ChapterInfo,
  ItemFields,
  ItemFilter,
  MediaSourceInfo,
  SubtitleDeliveryMethod,
  MediaStream,
  BaseItemKind,
  PlaybackInfoResponse,
  MediaStreamType
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { useMediaControls, useNow } from '@vueuse/core';
import { itemsStore } from '.';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { getImageInfo } from '@/utils/images';
import { msToTicks } from '@/utils/time';
import playbackProfile from '@/utils/playback-profiles';

/**
 * == INTERFACES ==
 */

export enum PlaybackStatus {
  Stopped = 0,
  Playing = 1,
  Paused = 2,
  Buffering = 3,
  Error = 4
}

export enum RepeatMode {
  RepeatNone = 0,
  RepeatOne = 1,
  RepeatAll = 2
}

export enum InitMode {
  Unknown = 0,
  Shuffle = 1,
  Item = 2,
  ShuffleItem = 3
}

export interface PlaybackTrack {
  label: string;
  src?: string;
  srcLang?: string;
  srcIndex: number;
  type: SubtitleDeliveryMethod;
  codec?: string;
}

export interface PlaybackExternalTrack extends PlaybackTrack {
  src: string;
  codec: string;
}

interface PlaybackManagerState {
  status: PlaybackStatus;
  currentSourceUrl: string | undefined;
  isRemotePlayer: boolean;
  lastItemIndex: number | undefined;
  currentItemIndex: number | undefined;
  currentMediaSource: MediaSourceInfo | undefined;
  currentVideoStreamIndex: number | undefined;
  currentAudioStreamIndex: number | undefined;
  currentSubtitleStreamIndex: number | undefined;
  currentItemChapters: ChapterInfo[] | undefined;
  remotePlaybackTime: number;
  lastProgressUpdate: number;
  remoteCurrentVolume: number;
  isRemoteMuted: boolean;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  queue: string[];
  originalQueue: string[];
  playSessionId: string | undefined;
  playbackInitiator: BaseItemDto | undefined;
  playbackInitMode: InitMode;
}

/**
 * == STATE VARIABLES
 */
/**
 * Amount of time to wait between playback reports
 */
const progressReportInterval = 3500;
const defaultState: PlaybackManagerState = {
  status: PlaybackStatus.Stopped,
  currentSourceUrl: undefined,
  isRemotePlayer: false,
  lastItemIndex: undefined,
  currentItemIndex: undefined,
  currentMediaSource: undefined,
  currentVideoStreamIndex: undefined,
  currentAudioStreamIndex: undefined,
  currentSubtitleStreamIndex: undefined,
  currentItemChapters: undefined,
  remotePlaybackTime: 0,
  lastProgressUpdate: 0,
  remoteCurrentVolume: 100,
  isRemoteMuted: false,
  isShuffling: false,
  repeatMode: RepeatMode.RepeatNone,
  queue: [],
  originalQueue: [],
  playSessionId: undefined,
  playbackInitiator: undefined,
  playbackInitMode: InitMode.Unknown
};

const state = reactive<PlaybackManagerState>(cloneDeep(defaultState));
const reactiveDate = useNow();
export const mediaElementRef = ref<HTMLMediaElement>();
export const mediaControls = useMediaControls(mediaElementRef);
const remote = useRemote();
/**
 * Previously, we created a new MediaMetadata every time the item changed. However,
 * that made the MediaSession controls disappear for a second. Keeping the metadata
 * as a global variable and updating it solves this problem.
 */
const mediaMetadata = new MediaMetadata();

class PlaybackManagerStore {
  /**
   * == GETTERS ==
   */
  public get status(): PlaybackStatus {
    return state.status;
  }
  /**
   * Get if playback is buffering
   */
  public get isBuffering(): boolean {
    return this.status === PlaybackStatus.Buffering;
  }
  /**
   * Get if an item is being played at this moment
   */
  public get isPlaying(): boolean {
    return this.status !== PlaybackStatus.Stopped;
  }
  /**
   * Get if the repeat status is not set to none
   */
  public get isRepeating(): boolean {
    return state.repeatMode !== RepeatMode.RepeatNone;
  }
  /**
   * Get if the queue is being repeated
   */
  public get isRepeatingAll(): boolean {
    return state.repeatMode === RepeatMode.RepeatAll;
  }
  /**
   * Get if an item is being repeated
   */
  public get isRepeatingOnce(): boolean {
    return state.repeatMode === RepeatMode.RepeatOne;
  }
  /**
   * Get if an item is paused at this moment
   */
  public get isPaused(): boolean {
    return this.status === PlaybackStatus.Paused;
  }
  /**
   * Get if the current playback session is remote or local
   */
  public get isRemotePlayer(): boolean {
    return state.isRemotePlayer;
  }
  /**
   * Get reactive BaseItemDto's objects of the queue
   */
  public get queue(): BaseItemDto[] {
    const items = itemsStore();

    return items.getItemsById(state.queue);
  }
  /**
   * Get a reactive BaseItemDto object of the currently playing item
   */
  public get currentItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex]);
    }
  }
  public get currentSourceUrl(): string | undefined {
    return state.currentSourceUrl;
  }
  /**
   * Get a reactive BaseItemDto object of the previous item in queue
   */
  public get previousItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (!isNil(state.lastItemIndex)) {
      return items.getItemById(state.queue[state.lastItemIndex]);
    }
  }
  /**
   * Get a reactive BaseItemDto object of the next item in queue
   */
  public get nextItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      return items.getItemById(state.queue[state.currentItemIndex + 1]);
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      return items.getItemById(state.queue[0]);
    }
  }
  /**
   * Get the type of the currently playing item
   */
  public get currentlyPlayingType(): BaseItemKind | undefined {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex])?.Type;
    }
  }
  /**
   * Get the media type of the currently playing item
   */
  public get currentlyPlayingMediaType(): string | null | undefined {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex])?.MediaType;
    }
  }
  /**
   * Get current's item audio tracks
   */
  public get currentItemAudioTracks(): MediaStream[] | undefined {
    if (!isNil(state.currentMediaSource?.MediaStreams)) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Audio';
      });
    }
  }
  /**
   * Get current's item subtitle tracks
   */
  public get currentItemSubtitleTracks(): MediaStream[] | undefined {
    if (!isNil(state.currentMediaSource?.MediaStreams)) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Subtitle';
      });
    }
  }

  public get currentItemParsedSubtitleTracks(): PlaybackTrack[] | undefined {
    if (!isNil(state.currentMediaSource)) {
      return state.currentMediaSource.MediaStreams?.map((stream, index) => ({
        srcIndex: index,
        ...stream
      }))
        .filter(
          (sub) =>
            sub.Type === MediaStreamType.Subtitle &&
            (sub.DeliveryMethod === SubtitleDeliveryMethod.Encode ||
              sub.DeliveryMethod === SubtitleDeliveryMethod.External)
        )
        .map((sub) => ({
          label: sub.DisplayTitle ?? 'Undefined',
          src:
            sub.DeliveryMethod === SubtitleDeliveryMethod.External
              ? `${remote.sdk.api?.basePath}${sub.DeliveryUrl}`
              : undefined,
          srcLang: sub.Language ?? undefined,
          type: sub.DeliveryMethod ?? SubtitleDeliveryMethod.Drop,
          srcIndex: sub.srcIndex,
          codec: sub.Codec || undefined
        }));
    }
  }

  /**
   * Filters the native subtitles
   *
   * As our profile requires either SSA or VTT, if it's not SSA it'll be VTT.
   * This is done this way as server sends as "Codec" the initial value of the track, so it can be webvtt, subrip, srt...
   * This is easier to filter out the SSA subs
   */
  public get currentItemVttParsedSubtitleTracks(): PlaybackExternalTrack[] {
    return (
      this.currentItemParsedSubtitleTracks?.filter(
        (sub): sub is PlaybackExternalTrack =>
          !!sub.codec && sub.codec !== 'ass' && sub.codec !== 'ssa' && !!sub.src
      ) ?? []
    );
  }

  public get currentItemAssParsedSubtitleTracks(): PlaybackExternalTrack[] {
    return (
      this.currentItemParsedSubtitleTracks?.filter(
        (sub): sub is PlaybackExternalTrack =>
          !!sub.codec &&
          (sub.codec === 'ass' || sub.codec === 'ssa') &&
          !!sub.src
      ) ?? []
    );
  }

  public get currentVideoTrack(): MediaStream | undefined {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentVideoStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Video' &&
          stream.Index === state.currentVideoStreamIndex
      );
    }
  }

  public get currentAudioTrack(): MediaStream | undefined {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentAudioStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Audio' &&
          stream.Index === state.currentAudioStreamIndex
      );
    }
  }

  public get currentSubtitleTrack(): MediaStream | undefined {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentSubtitleStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Subtitle' &&
          stream.Index === state.currentSubtitleStreamIndex
      );
    }
  }

  public get currentSubtitleStreamIndex(): number | undefined {
    return state.currentSubtitleStreamIndex;
  }
  public set currentSubtitleStreamIndex(newIndex: number | undefined) {
    state.currentSubtitleStreamIndex = newIndex;
  }

  public get currentAudioStreamIndex(): number | undefined {
    return state.currentAudioStreamIndex;
  }
  public set currentAudioStreamIndex(newIndex: number | undefined) {
    state.currentAudioStreamIndex = newIndex;
  }

  public get initiator(): BaseItemDto | undefined {
    return state.playbackInitiator;
  }

  public get playbackInitMode(): InitMode {
    return state.playbackInitMode;
  }

  public get queueIds(): string[] {
    return state.queue;
  }

  public get isShuffling(): boolean {
    return state.isShuffling;
  }

  public get repeatMode(): RepeatMode {
    return state.repeatMode;
  }

  public get currentTime(): number {
    return !this.isRemotePlayer
      ? mediaControls.currentTime.value
      : state.remotePlaybackTime;
  }
  public set currentTime(newValue: number) {
    if (this.isRemotePlayer) {
      state.remotePlaybackTime = newValue;
    } else {
      mediaControls.currentTime.value = newValue;
    }
  }

  public get currentItemIndex(): number | undefined {
    return state.currentItemIndex;
  }
  public set currentItemIndex(index: number | undefined) {
    if (state.currentItemIndex !== index) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex = index;
      this.currentTime = 0;
    }
  }

  public get currentMediaSource(): MediaSourceInfo | undefined {
    return state.currentMediaSource;
  }

  public get isMuted(): boolean {
    return state.isRemotePlayer
      ? state.isRemoteMuted
      : mediaControls.muted.value;
  }
  private set isMuted(newValue: boolean) {
    if (state.isRemotePlayer) {
      state.isRemoteMuted = newValue;
    } else {
      mediaControls.muted.value = newValue;
    }
  }

  public get currentVolume(): number {
    return state.isRemotePlayer
      ? state.remoteCurrentVolume
      : mediaControls.volume.value * 100;
  }
  public set currentVolume(newVolume: number) {
    newVolume = newVolume > 100 ? 100 : newVolume;
    newVolume = newVolume < 0 ? 0 : newVolume;
    this.isMuted = newVolume === 0 ? true : false;

    if (state.isRemotePlayer) {
      state.remoteCurrentVolume = newVolume;
    } else {
      mediaControls.volume.value = newVolume / 100;
    }
  }

  private get _pendingProgressReport(): boolean {
    return (
      reactiveDate.value.valueOf() - state.lastProgressUpdate >=
        progressReportInterval &&
      this.status !== PlaybackStatus.Stopped &&
      this.status !== PlaybackStatus.Error
    );
  }

  /**
   * == ACTIONS ==
   */
  /**
   * Add or remove media handlers
   */
  private _handleMediaSession = (remove = false): void => {
    if (window.navigator.mediaSession) {
      const actionHandlers: {
        [key in MediaSessionAction]?: MediaSessionActionHandler;
      } = {
        play: (): void => {
          this.unpause();
        },
        pause: (): void => {
          this.pause();
        },
        previoustrack: (): void => {
          this.setPreviousTrack();
        },
        nexttrack: (): void => {
          this.setNextTrack();
        },
        stop: (): void => {
          this.stop();
        },
        seekbackward: (): void => {
          this.skipBackward();
        },
        seekforward: (): void => {
          this.skipForward();
        },
        seekto: (action): void => {
          this.currentTime = action.seekTime || 1;
        }
      };

      for (const [action, handler] of Object.entries(actionHandlers)) {
        try {
          window.navigator.mediaSession.setActionHandler(
            action as MediaSessionAction,
            // eslint-disable-next-line unicorn/no-null
            remove ? null : handler
          );
        } catch {
          console.error(
            `The media session action "${action}" is not supported.`
          );
        }
      }

      window.navigator.mediaSession.metadata = remove
        ? // eslint-disable-next-line unicorn/no-null
          null
        : mediaMetadata;
    }
  };

  /**
   * Updates mediasession metadata based on the currently playing item
   */
  private _updateMediaSessionMetadata = (): void => {
    if (this.status !== PlaybackStatus.Stopped && !isNil(this.currentItem)) {
      mediaMetadata.title = this.currentItem.Name || '';
      mediaMetadata.artist = this.currentItem.AlbumArtist || '';
      mediaMetadata.album = this.currentItem.Album || '';
      mediaMetadata.artwork = [
        {
          src:
            getImageInfo(this.currentItem, {
              width: 96
            }).url || '',
          sizes: '96x96'
        },
        {
          src:
            getImageInfo(this.currentItem, {
              width: 128
            }).url || '',
          sizes: '128x128'
        },
        {
          src:
            getImageInfo(this.currentItem, {
              width: 192
            }).url || '',
          sizes: '192x192'
        },
        {
          src:
            getImageInfo(this.currentItem, {
              width: 256
            }).url || '',
          sizes: '256x256'
        },
        {
          src:
            getImageInfo(this.currentItem, {
              width: 384
            }).url || '',
          sizes: '384x384'
        },
        {
          src:
            getImageInfo(this.currentItem, {
              width: 512
            }).url || '',
          sizes: '512x512'
        }
      ];
    } else {
      mediaMetadata.title = '';
      mediaMetadata.artist = '';
      mediaMetadata.album = '';
      mediaMetadata.artwork = [];
    }
  };

  /**
   * Update MediaSession API status
   */
  private _updateMediaSessionStatus = (): void => {
    if (window.navigator.mediaSession) {
      switch (this.status) {
        case PlaybackStatus.Playing: {
          window.navigator.mediaSession.playbackState = 'playing';
          break;
        }
        case PlaybackStatus.Paused: {
          window.navigator.mediaSession.playbackState = 'paused';
          break;
        }
      }
    }
  };
  /**
   * Report current item playback progress to server
   */
  private _reportPlaybackProgress = async (): Promise<void> => {
    if (!isNil(this.currentTime) && !isNil(this.currentItem)) {
      await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackProgress({
        playbackProgressInfo: {
          ItemId: this.currentItem.Id,
          PlaySessionId: state.playSessionId,
          IsPaused: this.isPaused,
          PositionTicks: Math.round(msToTicks(this.currentTime * 1000))
        }
      });

      state.lastProgressUpdate = Date.now();
    }
  };

  /**
   * Report playback stopped to the server. Used by the "Now playing" statistics in other clients.
   */
  private _reportPlaybackStopped = async (
    itemId: string,
    sessionId = state.playSessionId,
    currentTime = this.currentTime,
    updateState = true
  ): Promise<void> => {
    await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStopped({
      playbackStopInfo: {
        ItemId: itemId,
        PlaySessionId: sessionId,
        PositionTicks: msToTicks((currentTime || 0) * 1000)
      }
    });

    if (updateState) {
      state.lastProgressUpdate = Date.now();
    }
  };

  /**
   * Report playback start to the server. Used by the "Now playing" statistics in other clients.
   */
  private _reportPlaybackStart = async (itemId: string): Promise<void> => {
    await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStart({
      playbackStartInfo: {
        CanSeek: true,
        ItemId: itemId,
        PlaySessionId: state.playSessionId,
        MediaSourceId: state.currentMediaSource?.Id,
        AudioStreamIndex: state.currentAudioStreamIndex,
        SubtitleStreamIndex: state.currentSubtitleStreamIndex
      }
    });

    state.lastProgressUpdate = Date.now();
  };
  public addToQueue = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    state.queue.push(...translatedItem);
  };

  public removeFromQueue = (itemId: string): void => {
    if (state.queue.includes(itemId)) {
      state.queue.splice(state.queue.indexOf(itemId), 1);
    }
  };

  public clearQueue = (): void => {
    state.queue = [];
  };

  /**
   * Plays an item and initializes playbackManager's state
   */
  public play = async ({
    item,
    audioTrackIndex,
    subtitleTrackIndex,
    videoTrackIndex,
    startFromIndex = 0,
    startFromTime = 0,
    initiator,
    startShuffled = false
  }: {
    item: BaseItemDto;
    audioTrackIndex?: number;
    subtitleTrackIndex?: number;
    videoTrackIndex?: number;
    startFromIndex?: number;
    startFromTime?: number;
    initiator?: BaseItemDto;
    startShuffled?: boolean;
  }): Promise<void> => {
    try {
      if (state.status !== PlaybackStatus.Stopped) {
        this.stop();
      }

      state.status = PlaybackStatus.Buffering;
      state.queue = await this.translateItemsForPlayback(item, startShuffled);

      if (videoTrackIndex !== undefined) {
        state.currentVideoStreamIndex = videoTrackIndex;
      }

      if (audioTrackIndex !== undefined) {
        state.currentAudioStreamIndex = audioTrackIndex;
      }

      if (subtitleTrackIndex !== undefined) {
        state.currentSubtitleStreamIndex = subtitleTrackIndex;
      }

      state.currentItemIndex = startFromIndex;
      this.currentTime = startFromTime;

      if (!startShuffled && initiator) {
        state.playbackInitMode = InitMode.Item;
      } else if (startShuffled && !initiator) {
        state.playbackInitMode = InitMode.Shuffle;
      } else if (startShuffled && initiator) {
        state.playbackInitMode = InitMode.ShuffleItem;
      } else {
        state.playbackInitMode = InitMode.Unknown;
      }

      state.playbackInitiator = initiator;
      state.status = PlaybackStatus.Playing;
    } catch {
      state.status = PlaybackStatus.Error;
    }
  };

  /**
   * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public playNext = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    if (state.currentItemIndex !== undefined) {
      /**
       * Removes the elements that already exists and append the new ones next to the currently playing item
       */
      const newQueue = state.queue.filter(
        (index) => !translatedItem.includes(index)
      );

      newQueue.splice(state.currentItemIndex + 1, 0, ...translatedItem);
      this.setNewQueue(newQueue);
    }
  };

  public pause = (): void => {
    if (state.status === PlaybackStatus.Playing) {
      state.status = PlaybackStatus.Paused;
    }
  };

  public unpause = (): void => {
    if (state.status === PlaybackStatus.Paused) {
      state.status = PlaybackStatus.Playing;
    }
  };

  public playPause = (): void => {
    if (state.status === PlaybackStatus.Playing) {
      this.pause();
    } else if (state.status === PlaybackStatus.Paused) {
      this.unpause();
    }
  };

  public setNextTrack = (): void => {
    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex += 1;
      this.currentTime = 0;
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex = 0;
      this.currentTime = 0;
    } else {
      this.stop();
    }
  };

  public setPreviousTrack = (): void => {
    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex > 0 &&
      !isNil(this.currentTime) &&
      this.currentTime < 2
    ) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex -= 1;
    }

    this.currentTime = 0;
  };

  public setNewQueue = (queue: string[]): void => {
    let item;
    let lastItem;

    if (state.currentItemIndex !== undefined) {
      item = state.queue[state.currentItemIndex];
    }

    if (state.lastItemIndex !== undefined) {
      lastItem = state.queue[state.lastItemIndex];
    }

    const newIndex = queue?.indexOf(item || '');
    const lastItemNewIndex = queue?.indexOf(lastItem || '');

    state.queue = queue;
    state.lastItemIndex = lastItemNewIndex;
    state.currentItemIndex = newIndex;
  };

  public changeItemPosition = (
    itemId: string | undefined,
    newIndex: number
  ): void => {
    if (itemId && state.queue.includes(itemId)) {
      const newQueue = state.queue.filter((index) => index !== itemId);

      newQueue.splice(newIndex, 0, itemId);
      this.setNewQueue(newQueue);
    }
  };

  public stop = (): void => {
    const sessionId = String(state.playSessionId || '');
    const time = Number(this.currentTime);
    const itemId = String(this.currentItem?.Id || '');
    const volume = Number(this.currentVolume);

    Object.assign(state, defaultState);
    this.currentVolume = volume;

    window.setTimeout(async () => {
      try {
        if (sessionId && itemId && time && remote.auth.currentUser) {
          await this._reportPlaybackStopped(itemId, sessionId, time, false);
        }
      } catch {}
    });
  };

  public skipForward = (): void => {
    this.currentTime = (this.currentTime || 0) + 15;
  };

  public skipBackward = (): void => {
    this.currentTime =
      (this.currentTime || 0) > 15 ? (this.currentTime || 0) - 15 : 0;
  };

  public toggleShuffle = (): void => {
    if (state.queue && !isNil(state.currentItemIndex)) {
      if (!state.isShuffling) {
        const queue = shuffle(state.queue);

        state.originalQueue = state.queue;

        const item = state.queue[state.currentItemIndex];
        const itemIndex = queue.indexOf(item);

        queue.splice(itemIndex, 1);
        queue.unshift(item);

        state.queue = queue;
        state.currentItemIndex = 0;
        state.lastItemIndex = undefined;
        state.isShuffling = true;
      } else {
        const item = state.queue[state.currentItemIndex];

        state.currentItemIndex = state.originalQueue.indexOf(item);
        state.queue = state.originalQueue;
        state.originalQueue = [];
        state.lastItemIndex = undefined;
        state.isShuffling = false;
      }
    }
  };

  /**
   * Toggles between the different repeat modes
   *
   * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
   */
  public toggleRepeatMode = (): void => {
    if (state.repeatMode === RepeatMode.RepeatNone) {
      state.repeatMode =
        state.queue.length > 1 ? RepeatMode.RepeatAll : RepeatMode.RepeatOne;
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      state.repeatMode =
        state.queue.length > 1 ? RepeatMode.RepeatOne : RepeatMode.RepeatNone;
    } else {
      state.repeatMode = RepeatMode.RepeatNone;
    }
  };

  /**
   * Toggles the mute function
   *
   * If the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
   */
  public toggleMute = (): void => {
    if (this.currentVolume === 0 && this.isMuted) {
      this.currentVolume = 100;
    }

    this.isMuted = !this.isMuted;
  };

  public getItemPlaybackInfo = async (
    item = this.currentItem,
    audioStreamIndex = this.currentAudioStreamIndex,
    subtitleStreamIndex = this.currentSubtitleStreamIndex
  ): Promise<PlaybackInfoResponse | undefined> => {
    if (item) {
      return (
        await remote.sdk.newUserApi(getMediaInfoApi).getPostedPlaybackInfo({
          itemId: item?.Id || '',
          userId: remote.auth.currentUserId,
          autoOpenLiveStream: true,
          playbackInfoDto: { DeviceProfile: playbackProfile },
          mediaSourceId: item.Id,
          audioStreamIndex,
          subtitleStreamIndex
        })
      ).data;
    }
  };

  public getItemPlaybackUrl = (
    mediaSource = this.currentMediaSource
  ): string | undefined => {
    if (
      mediaSource?.SupportsDirectStream &&
      mediaSource.Type &&
      remote.auth.currentUserToken
    ) {
      const directOptions: Record<string, string> = {
        Static: String(true),
        mediaSourceId: String(mediaSource.Id),
        deviceId: remote.sdk.deviceInfo.id,
        api_key: remote.auth.currentUserToken,
        Tag: mediaSource.ETag || '',
        LiveStreamId: mediaSource.LiveStreamId || ''
      };

      const parameters = new URLSearchParams(directOptions).toString();

      const mediaType =
        mediaSource.Type === 'Audio' ? mediaSource.Type : 'Videos';

      return `${remote.sdk.api?.basePath}/${mediaType}/${mediaSource.Id}/stream.${mediaSource.Container}?${parameters}`;
    } else if (mediaSource?.SupportsTranscoding && mediaSource.TranscodingUrl) {
      return remote.sdk.api?.basePath + mediaSource.TranscodingUrl;
    }
  };

  /**
   * Builds an array of item ids based on a collection item (i.e album, tv show, etc...)
   *
   * @param item
   * @param shuffle
   */
  public translateItemsForPlayback = async (
    item: BaseItemDto,
    shuffle = false
  ): Promise<string[]> => {
    let responseItems: BaseItemDto[] = [];

    if (item.Type === 'Program' && item.ChannelId) {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            ids: [item.ChannelId],
            limit: 300,
            sortBy: shuffle ? ['Random'] : ['SortName'],
            userId: remote.auth.currentUserId,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.Type === 'Playlist') {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            parentId: item.Id,
            limit: 300,
            sortBy: shuffle ? ['Random'] : undefined,
            userId: remote.auth.currentUserId,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.Type === 'MusicArtist' && item.Id) {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            artistIds: [item.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            mediaTypes: ['Audio'],
            limit: 300,
            sortBy: shuffle ? ['Random'] : ['SortName'],
            userId: remote.auth.currentUserId,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.Type === 'MusicGenre' && item.Id) {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            genreIds: [item.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            mediaTypes: ['Audio'],
            limit: 300,
            sortBy: shuffle ? ['Random'] : ['SortName'],
            userId: remote.auth.currentUserId,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.IsFolder) {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            parentId: item.Id,
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: ['BoxSet'].includes(item.Type || '')
              ? undefined
              : shuffle
              ? ['Random']
              : ['SortName'],
            mediaTypes: ['Audio', 'Video'],
            limit: 300,
            userId: remote.auth.currentUserId,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.Type === 'Episode') {
      if (
        remote.auth.currentUser?.Configuration?.EnableNextEpisodeAutoPlay &&
        item.SeriesId
      ) {
        /**
         * If autoplay is enabled and we have a seriesId, get the rest of the episodes
         */
        responseItems =
          (
            await remote.sdk.newUserApi(getTvShowsApi).getEpisodes({
              seriesId: item.SeriesId,
              isMissing: false,
              startItemId: item.Id,
              limit: 300,
              userId: remote.auth.currentUserId,
              fields: Object.values(ItemFields)
            })
          ).data.Items || [];
      } else {
        responseItems.push(item);
      }
    } else {
      /**
       * This type of item doesn't require any special processing
       */
      return [item.Id || ''];
    }

    return responseItems.map((index) => {
      return index.Id || '';
    });
  };

  public fetchCurrentMediaSource = async (): Promise<void> => {
    const playbackInfo = await this.getItemPlaybackInfo();

    if (playbackInfo) {
      const mediaSource = playbackInfo.MediaSources?.[0];

      if (!mediaSource) {
        const { t } = usei18n();

        useSnackbar(t('errors.cantPlayItem'), 'error');
      } else {
        state.playSessionId = playbackInfo?.PlaySessionId || '';
        state.currentMediaSource = mediaSource;
        state.currentSourceUrl = this.getItemPlaybackUrl();
      }
    }

    this._updateMediaSessionMetadata();
  };

  public constructor() {
    watch(
      () => this.status,
      async (newValue, oldValue) => {
        const remove = this.status === PlaybackStatus.Stopped;

        if (
          this.status === PlaybackStatus.Playing &&
          !mediaControls.playing.value
        ) {
          mediaControls.playing.value = true;
        } else if (
          this.status === PlaybackStatus.Paused &&
          mediaControls.playing.value
        ) {
          mediaControls.playing.value = false;
        }

        if (
          newValue === PlaybackStatus.Stopped ||
          oldValue === PlaybackStatus.Error ||
          oldValue === PlaybackStatus.Stopped
        ) {
          this._handleMediaSession(remove);
        }

        if (!remove) {
          this._updateMediaSessionStatus();
          await this._reportPlaybackProgress();
        }
      }
    );

    /**
     * Sets the current media source url and MediaSession metadata
     */
    watch(
      () => this.currentItemIndex,
      async (newIndex) => {
        await this.fetchCurrentMediaSource();

        if (newIndex && !state.currentSourceUrl) {
          const { t } = usei18n();

          useSnackbar(t('errors.cantPlayItem'), 'error');
          this.stop();
        }

        if (this.previousItem?.Id) {
          await this._reportPlaybackStopped(this.previousItem.Id);
        }

        /**
         * And then report play for the next one if it exists
         */
        if (!isNil(this.currentItem) && !isNil(this.currentItem.Id)) {
          await this._reportPlaybackStart(this.currentItem.Id);
        }
      }
    );

    watch(
      () => this.currentAudioStreamIndex,
      (newVal, oldVal) => {
        if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
          this.fetchCurrentMediaSource();
        }
      }
    );

    watch(
      () => ({
        currentSubtitleStreamIndex: this.currentSubtitleStreamIndex,
        currentSubtitleTrack: this.currentSubtitleTrack
      }),
      (oldVal, newVal) => {
        if (
          oldVal.currentSubtitleStreamIndex !==
            newVal.currentSubtitleStreamIndex &&
          (oldVal.currentSubtitleTrack?.DeliveryMethod ===
            SubtitleDeliveryMethod.Encode ||
            newVal.currentSubtitleTrack?.DeliveryMethod ===
              SubtitleDeliveryMethod.Encode)
        ) {
          /**
           * This is the case when you go from or to a situation where subs are burnt in.
           * In that case, we always need to fetch a new media source.
           */
          this.fetchCurrentMediaSource();
        }
      }
    );

    watch(
      () => this._pendingProgressReport,
      async () => {
        if (this._pendingProgressReport) {
          await this._reportPlaybackProgress();
        }
      }
    );

    /**
     * Dispose on logout
     */
    watch(
      () => remote.auth.currentUser,
      () => {
        if (isNil(remote.auth.currentUser)) {
          playbackManager.stop();
        }
      }
    );

    watch(mediaControls.playing, () => {
      if (playbackManager.status !== PlaybackStatus.Buffering) {
        state.status = mediaControls.playing.value
          ? PlaybackStatus.Playing
          : PlaybackStatus.Paused;
      }
    });

    watch(mediaControls.waiting, () => {
      state.status = mediaControls.waiting.value
        ? PlaybackStatus.Buffering
        : PlaybackStatus.Playing;
    });

    watch(mediaControls.ended, () => {
      if (mediaControls.ended.value) {
        playbackManager.setNextTrack();
      }
    });
  }
}

const playbackManager = new PlaybackManagerStore();

export default playbackManager;
