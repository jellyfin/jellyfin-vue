/**
 * This store handles the state of the playback
 *
 * It must be used in an agnostic way to cover both local and remote playback.
 * If you want to handle the state of the local player element, use playerElement store instead.
 */
import { reactive, watch } from 'vue';
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
import { getInstantMixApi } from '@jellyfin/sdk/lib/utils/api/instant-mix-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
/**
 * It's important to import these from globals.ts directly to avoid cycles and ReferenceError
 */
import { now as reactiveDate, mediaControls } from './globals';
import { itemsStore } from '.';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { getImageInfo } from '@/utils/images';
import { msToTicks } from '@/utils/time';
import playbackProfile from '@/utils/playback-profiles';

/**
 * == INTERFACES AND TYPES ==
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
  currentMediaSourceIndex: number | undefined;
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
 * == UTILITY VARIABLES ==
 */
/**
 * Amount of time to wait between playback reports
 */
const progressReportInterval = 3500;
const remote = useRemote();

/**
 * == CLASS CONSTRUCTOR ==
 */
class PlaybackManagerStore {
  /**
   * == STATE ==
   */
  private _defaultState: PlaybackManagerState = {
    status: PlaybackStatus.Stopped,
    currentSourceUrl: undefined,
    isRemotePlayer: false,
    lastItemIndex: undefined,
    currentItemIndex: undefined,
    currentMediaSource: undefined,
    currentMediaSourceIndex: undefined,
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

  private _state = reactive<PlaybackManagerState>(
    cloneDeep(this._defaultState)
  );
  /**
   * == GETTERS AND SETTERS ==
   */
  /**
   * Previously, we created a new MediaMetadata every time the item changed. However,
   * that made the MediaSession controls disappear for a second. Keeping the metadata
   * as a global variable and updating it solves this problem.
   */
  private _mediaMetadata = new MediaMetadata();
  public get status(): PlaybackStatus {
    return this._state.status;
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
    return this._state.repeatMode !== RepeatMode.RepeatNone;
  }
  /**
   * Get if the queue is being repeated
   */
  public get isRepeatingAll(): boolean {
    return this._state.repeatMode === RepeatMode.RepeatAll;
  }
  /**
   * Get if an item is being repeated
   */
  public get isRepeatingOnce(): boolean {
    return this._state.repeatMode === RepeatMode.RepeatOne;
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
    return this._state.isRemotePlayer;
  }
  /**
   * Get reactive BaseItemDto's objects of the queue
   */
  public get queue(): BaseItemDto[] {
    const items = itemsStore();

    return items.getItemsById(this._state.queue);
  }
  /**
   * Get a reactive BaseItemDto object of the currently playing item
   */
  public get currentItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (!isNil(this._state.currentItemIndex)) {
      return items.getItemById(this._state.queue[this._state.currentItemIndex]);
    }
  }
  public get currentSourceUrl(): string | undefined {
    return this._state.currentSourceUrl;
  }
  /**
   * Get a reactive BaseItemDto object of the previous item in queue
   */
  public get previousItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (!isNil(this._state.lastItemIndex)) {
      return items.getItemById(this._state.queue[this._state.lastItemIndex]);
    }
  }
  /**
   * Get a reactive BaseItemDto object of the next item in queue
   */
  public get nextItem(): BaseItemDto | undefined {
    const items = itemsStore();

    if (
      !isNil(this._state.currentItemIndex) &&
      this._state.currentItemIndex + 1 < this._state.queue.length
    ) {
      return items.getItemById(
        this._state.queue[this._state.currentItemIndex + 1]
      );
    } else if (this._state.repeatMode === RepeatMode.RepeatAll) {
      return items.getItemById(this._state.queue[0]);
    }
  }
  /**
   * Get the type of the currently playing item
   */
  public get currentlyPlayingType(): BaseItemKind | undefined {
    const items = itemsStore();

    if (!isNil(this._state.currentItemIndex)) {
      return items.getItemById(this._state.queue[this._state.currentItemIndex])
        ?.Type;
    }
  }
  /**
   * Get the media type of the currently playing item
   */
  public get currentlyPlayingMediaType(): string | null | undefined {
    const items = itemsStore();

    if (!isNil(this._state.currentItemIndex)) {
      return items.getItemById(this._state.queue[this._state.currentItemIndex])
        ?.MediaType;
    }
  }
  /**
   * Get current's item audio tracks
   */
  public get currentItemAudioTracks(): MediaStream[] | undefined {
    if (!isNil(this._state.currentMediaSource?.MediaStreams)) {
      return this._state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Audio';
      });
    }
  }
  /**
   * Get current's item subtitle tracks
   */
  public get currentItemSubtitleTracks(): MediaStream[] | undefined {
    if (!isNil(this._state.currentMediaSource?.MediaStreams)) {
      return this._state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Subtitle';
      });
    }
  }

  public get currentItemParsedSubtitleTracks(): PlaybackTrack[] | undefined {
    if (!isNil(this._state.currentMediaSource)) {
      return this._state.currentMediaSource.MediaStreams?.map(
        (stream, index) => ({
          srcIndex: index,
          ...stream
        })
      )
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
      !isNil(this._state.currentMediaSource?.MediaStreams) &&
      !isNil(this._state.currentVideoStreamIndex)
    ) {
      return this._state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Video' &&
          stream.Index === this._state.currentVideoStreamIndex
      );
    }
  }

  public get currentAudioTrack(): MediaStream | undefined {
    if (
      !isNil(this._state.currentMediaSource?.MediaStreams) &&
      !isNil(this._state.currentAudioStreamIndex)
    ) {
      return this._state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Audio' &&
          stream.Index === this._state.currentAudioStreamIndex
      );
    }
  }

  public get currentSubtitleTrack(): MediaStream | undefined {
    if (
      !isNil(this._state.currentMediaSource?.MediaStreams) &&
      !isNil(this._state.currentSubtitleStreamIndex)
    ) {
      return this._state.currentMediaSource?.MediaStreams.find(
        (stream) =>
          stream.Type === 'Subtitle' &&
          stream.Index === this._state.currentSubtitleStreamIndex
      );
    }
  }

  public get currentSubtitleStreamIndex(): number | undefined {
    return this._state.currentSubtitleStreamIndex;
  }
  public set currentSubtitleStreamIndex(newIndex: number | undefined) {
    this._state.currentSubtitleStreamIndex = newIndex;
  }

  public get currentAudioStreamIndex(): number | undefined {
    return this._state.currentAudioStreamIndex;
  }
  public set currentAudioStreamIndex(newIndex: number | undefined) {
    this._state.currentAudioStreamIndex = newIndex;
  }

  public get initiator(): BaseItemDto | undefined {
    return this._state.playbackInitiator;
  }

  public get playbackInitMode(): InitMode {
    return this._state.playbackInitMode;
  }

  public get queueIds(): string[] {
    return this._state.queue;
  }

  public get isShuffling(): boolean {
    return this._state.isShuffling;
  }

  public get repeatMode(): RepeatMode {
    return this._state.repeatMode;
  }

  public get currentTime(): number {
    return this.isRemotePlayer
      ? this._state.remotePlaybackTime
      : mediaControls.currentTime.value;
  }
  public set currentTime(newValue: number) {
    if (this.isRemotePlayer) {
      this._state.remotePlaybackTime = newValue;
    } else {
      mediaControls.currentTime.value = newValue;
    }
  }

  public get currentItemIndex(): number | undefined {
    return this._state.currentItemIndex;
  }
  public set currentItemIndex(index: number | undefined) {
    if (this._state.currentItemIndex !== index) {
      this._state.lastItemIndex = this._state.currentItemIndex;
      this._state.currentItemIndex = index;
      this.currentTime = 0;
    }
  }

  public get currentMediaSource(): MediaSourceInfo | undefined {
    return this._state.currentMediaSource;
  }

  public get isMuted(): boolean {
    return this._state.isRemotePlayer
      ? this._state.isRemoteMuted
      : mediaControls.muted.value;
  }
  private set isMuted(newValue: boolean) {
    if (this._state.isRemotePlayer) {
      this._state.isRemoteMuted = newValue;
    } else {
      mediaControls.muted.value = newValue;
    }
  }

  public get currentVolume(): number {
    return this._state.isRemotePlayer
      ? this._state.remoteCurrentVolume
      : mediaControls.volume.value * 100;
  }
  public set currentVolume(newVolume: number) {
    newVolume = newVolume > 100 ? 100 : newVolume;
    newVolume = newVolume < 0 ? 0 : newVolume;
    this.isMuted = newVolume === 0 ? true : false;

    if (this._state.isRemotePlayer) {
      this._state.remoteCurrentVolume = newVolume;
    } else {
      mediaControls.volume.value = newVolume / 100;
    }
  }

  private get _pendingProgressReport(): boolean {
    return (
      reactiveDate.value.valueOf() - this._state.lastProgressUpdate >=
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
        : this._mediaMetadata;
    }
  };

  /**
   * Updates mediasession metadata based on the currently playing item
   */
  private _updateMediaSessionMetadata = (): void => {
    this._mediaMetadata.title = this.currentItem?.Name ?? '';
    this._mediaMetadata.artist = this.currentItem?.AlbumArtist ?? '';
    this._mediaMetadata.album = this.currentItem?.Album ?? '';
    this._mediaMetadata.artwork = this.currentItem
      ? [
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
        ]
      : [];
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
          PlaySessionId: this._state.playSessionId,
          IsPaused: this.isPaused,
          PositionTicks: Math.round(msToTicks(this.currentTime * 1000))
        }
      });

      this._state.lastProgressUpdate = Date.now();
    }
  };

  /**
   * Report playback stopped to the server. Used by the "Now playing" statistics in other clients.
   */
  private _reportPlaybackStopped = async (
    itemId: string,
    sessionId = this._state.playSessionId,
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
      this._state.lastProgressUpdate = Date.now();
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
        PlaySessionId: this._state.playSessionId,
        MediaSourceId: this._state.currentMediaSource?.Id,
        AudioStreamIndex: this._state.currentAudioStreamIndex,
        SubtitleStreamIndex: this._state.currentSubtitleStreamIndex
      }
    });

    this._state.lastProgressUpdate = Date.now();
  };
  public addToQueue = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    this._state.queue.push(...translatedItem);
  };

  public removeFromQueue = (itemId: string): void => {
    if (this._state.queue.includes(itemId)) {
      this._state.queue.splice(this._state.queue.indexOf(itemId), 1);
    }
  };

  public clearQueue = (): void => {
    this._state.queue = [];
  };

  /**
   * Plays an item and initializes playbackManager's state
   */
  public play = async ({
    item,
    audioTrackIndex,
    subtitleTrackIndex,
    videoTrackIndex,
    mediaSourceIndex,
    startFromIndex = 0,
    startFromTime = 0,
    initiator,
    startShuffled = false
  }: {
    item: BaseItemDto;
    audioTrackIndex?: number;
    subtitleTrackIndex?: number;
    videoTrackIndex?: number;
    mediaSourceIndex?: number;
    startFromIndex?: number;
    startFromTime?: number;
    initiator?: BaseItemDto;
    startShuffled?: boolean;
  }): Promise<void> => {
    try {
      if (this._state.status !== PlaybackStatus.Stopped) {
        this.stop();
      }

      this._state.status = PlaybackStatus.Buffering;
      this._state.queue = await this.translateItemsForPlayback(
        item,
        startShuffled
      );

      if (mediaSourceIndex !== undefined) {
        this._state.currentMediaSourceIndex = mediaSourceIndex;
      }

      if (videoTrackIndex !== undefined) {
        this._state.currentVideoStreamIndex = videoTrackIndex;
      }

      if (audioTrackIndex !== undefined) {
        this._state.currentAudioStreamIndex = audioTrackIndex;
      }

      if (subtitleTrackIndex !== undefined) {
        this._state.currentSubtitleStreamIndex = subtitleTrackIndex;
      }

      this._state.currentItemIndex = startFromIndex;
      this.currentTime = startFromTime;

      if (!startShuffled && initiator) {
        this._state.playbackInitMode = InitMode.Item;
      } else if (startShuffled && !initiator) {
        this._state.playbackInitMode = InitMode.Shuffle;
      } else if (startShuffled && initiator) {
        this._state.playbackInitMode = InitMode.ShuffleItem;
      } else {
        this._state.playbackInitMode = InitMode.Unknown;
      }

      this._state.playbackInitiator = initiator;
      this._state.status = PlaybackStatus.Playing;
    } catch {
      this._state.status = PlaybackStatus.Error;
    }
  };

  /**
   * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public playNext = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    if (this._state.currentItemIndex !== undefined) {
      /**
       * Removes the elements that already exists and append the new ones next to the currently playing item
       */
      const newQueue = this._state.queue.filter(
        (index) => !translatedItem.includes(index)
      );

      newQueue.splice(this._state.currentItemIndex + 1, 0, ...translatedItem);
      this.setNewQueue(newQueue);
    }
  };

  public pause = (): void => {
    if (this._state.status === PlaybackStatus.Playing) {
      this._state.status = PlaybackStatus.Paused;
    }
  };

  public unpause = (): void => {
    if (this._state.status === PlaybackStatus.Paused) {
      this._state.status = PlaybackStatus.Playing;
    }
  };

  public playPause = (): void => {
    if (this._state.status === PlaybackStatus.Playing) {
      this.pause();
    } else if (this._state.status === PlaybackStatus.Paused) {
      this.unpause();
    }
  };

  public setNextTrack = (): void => {
    if (
      !isNil(this._state.currentItemIndex) &&
      this._state.currentItemIndex + 1 < this._state.queue.length
    ) {
      this._state.lastItemIndex = this._state.currentItemIndex;
      this._state.currentItemIndex += 1;
      this.currentTime = 0;
    } else if (this._state.repeatMode === RepeatMode.RepeatAll) {
      this._state.lastItemIndex = this._state.currentItemIndex;
      this._state.currentItemIndex = 0;
      this.currentTime = 0;
    } else {
      this.stop();
    }
  };

  public setPreviousTrack = (): void => {
    if (
      !isNil(this._state.currentItemIndex) &&
      this._state.currentItemIndex > 0 &&
      !isNil(this.currentTime) &&
      this.currentTime < 2
    ) {
      this._state.lastItemIndex = this._state.currentItemIndex;
      this._state.currentItemIndex -= 1;
    }

    this.currentTime = 0;
  };

  public setNewQueue = (queue: string[]): void => {
    let item;
    let lastItem;

    if (this._state.currentItemIndex !== undefined) {
      item = this._state.queue[this._state.currentItemIndex];
    }

    if (this._state.lastItemIndex !== undefined) {
      lastItem = this._state.queue[this._state.lastItemIndex];
    }

    const newIndex = queue?.indexOf(item || '');
    const lastItemNewIndex = queue?.indexOf(lastItem || '');

    this._state.queue = queue;
    this._state.lastItemIndex = lastItemNewIndex;
    this._state.currentItemIndex = newIndex;
  };

  public changeItemPosition = (
    itemId: string | undefined,
    newIndex: number
  ): void => {
    if (itemId && this._state.queue.includes(itemId)) {
      const newQueue = this._state.queue.filter((index) => index !== itemId);

      newQueue.splice(newIndex, 0, itemId);
      this.setNewQueue(newQueue);
    }
  };

  public stop = (): void => {
    const sessionId = String(this._state.playSessionId || '');
    const time = Number(this.currentTime);
    const itemId = String(this.currentItem?.Id || '');
    const volume = Number(this.currentVolume);

    Object.assign(this._state, this._defaultState);
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
    if (this._state.queue && !isNil(this._state.currentItemIndex)) {
      if (this._state.isShuffling) {
        const item = this._state.queue[this._state.currentItemIndex];

        this._state.currentItemIndex = this._state.originalQueue.indexOf(item);
        this._state.queue = this._state.originalQueue;
        this._state.originalQueue = [];
        this._state.lastItemIndex = undefined;
        this._state.isShuffling = false;
      } else {
        const queue = shuffle(this._state.queue);

        this._state.originalQueue = this._state.queue;

        const item = this._state.queue[this._state.currentItemIndex];
        const itemIndex = queue.indexOf(item);

        queue.splice(itemIndex, 1);
        queue.unshift(item);

        this._state.queue = queue;
        this._state.currentItemIndex = 0;
        this._state.lastItemIndex = undefined;
        this._state.isShuffling = true;
      }
    }
  };

  /**
   * Toggles between the different repeat modes
   *
   * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
   */
  public toggleRepeatMode = (): void => {
    if (this._state.repeatMode === RepeatMode.RepeatNone) {
      this._state.repeatMode =
        this._state.queue.length > 1
          ? RepeatMode.RepeatAll
          : RepeatMode.RepeatOne;
    } else if (this._state.repeatMode === RepeatMode.RepeatAll) {
      this._state.repeatMode =
        this._state.queue.length > 1
          ? RepeatMode.RepeatOne
          : RepeatMode.RepeatNone;
    } else {
      this._state.repeatMode = RepeatMode.RepeatNone;
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

  public instantMixFromItem = async (itemId: string): Promise<void> => {
    const items = (
      await remote.sdk.newUserApi(getInstantMixApi).getInstantMixFromItem({
        id: itemId,
        userId: remote.auth.currentUserId,
        limit: 50
      })
    ).data.Items;

    if (!items) {
      throw new Error('No items found');
    }

    for (const item of items) {
      await this.addToQueue(item);
    }
  };

  public getItemPlaybackInfo = async (
    item = this.currentItem,
    mediaSourceIndex = this._state.currentMediaSourceIndex,
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
          mediaSourceId:
            item.MediaSources?.[mediaSourceIndex ?? 0].Id ?? item?.Id,
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

      const mediaType = (mediaSource.MediaStreams ?? []).every(
        (stream) => stream?.Type === 'Audio'
      )
        ? 'Audio'
        : 'Videos';

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
    if (!item.Id) {
      return [];
    }

    const sortOrder =
      item.Type === BaseItemKind.Playlist || item.Type === BaseItemKind.BoxSet
        ? undefined
        : ['SortName'];
    const sortBy = shuffle ? ['Random'] : sortOrder;
    const ids =
      item.Type === BaseItemKind.Program && item.ChannelId
        ? [item.ChannelId]
        : undefined;
    const artistIds =
      item.Type === BaseItemKind.MusicArtist ? [item.Id] : undefined;
    const parentId = item.IsFolder ? item.Id : undefined;
    let request;

    if (
      item.Type === BaseItemKind.Program ||
      item.Type === BaseItemKind.Playlist ||
      item.Type === BaseItemKind.MusicArtist ||
      item.Type === BaseItemKind.MusicGenre ||
      item.IsFolder
    ) {
      request = await remote.sdk.newUserApi(getItemsApi).getItems({
        ids,
        artistIds,
        filters: [ItemFilter.IsNotFolder],
        parentId,
        recursive: true,
        limit: 300,
        sortBy,
        userId: remote.auth.currentUserId,
        fields: Object.values(ItemFields)
      });
    } else if (
      item.Type === BaseItemKind.Episode &&
      remote.auth.currentUser?.Configuration?.EnableNextEpisodeAutoPlay &&
      item.SeriesId
    ) {
      /**
       * If autoplay is enabled and we have a seriesId, get the rest of the episodes
       */
      request = await remote.sdk.newUserApi(getTvShowsApi).getEpisodes({
        seriesId: item.SeriesId,
        isMissing: false,
        startItemId: item.Id,
        limit: 300,
        userId: remote.auth.currentUserId,
        fields: Object.values(ItemFields)
      });
    }

    /**
     * When no extra processing was needed, we add the item itself
     */
    const responseItems = request ? request.data.Items : [item];

    return (
      responseItems
        ?.filter((i): i is { Id: string } => i.Id !== undefined)
        .map((i) => i.Id) ?? []
    );
  };

  public setCurrentMediaSource = async (): Promise<void> => {
    /**
     * Set values to undefined so the next item doesn't play the previous one while the requests are in progress
     */
    this._state.playSessionId = undefined;
    this._state.currentMediaSource = undefined;
    this._state.currentSourceUrl = undefined;

    const playbackInfo = await this.getItemPlaybackInfo();

    if (playbackInfo) {
      const mediaSource = playbackInfo.MediaSources?.[0];

      if (mediaSource) {
        this._state.playSessionId = playbackInfo?.PlaySessionId || '';
        this._state.currentMediaSource = mediaSource;
        this._state.currentSourceUrl = this.getItemPlaybackUrl();
      } else {
        const { t } = usei18n();

        useSnackbar(t('errors.cantPlayItem'), 'error');
      }
    }
  };

  public constructor() {
    watch(
      () => this.status,
      async (newValue, oldValue) => {
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
          newValue === PlaybackStatus.Error
        ) {
          this._handleMediaSession(true);
        } else if (
          oldValue === PlaybackStatus.Stopped ||
          oldValue === PlaybackStatus.Error
        ) {
          this._handleMediaSession();
        }

        this._updateMediaSessionStatus();
        await this._reportPlaybackProgress();
      }
    );

    /**
     * Sets the current media source url and MediaSession metadata
     */
    watch(
      () => this.currentItemIndex,
      async (newIndex) => {
        this._updateMediaSessionMetadata();
        await this.setCurrentMediaSource();

        if (newIndex && !this._state.currentSourceUrl) {
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
      async (newVal, oldVal) => {
        if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
          await this.setCurrentMediaSource();
        }
      }
    );

    watch(
      () => ({
        currentSubtitleStreamIndex: this.currentSubtitleStreamIndex,
        currentSubtitleTrack: this.currentSubtitleTrack
      }),
      async (oldVal, newVal) => {
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
          await this.setCurrentMediaSource();
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
        this._state.status = mediaControls.playing.value
          ? PlaybackStatus.Playing
          : PlaybackStatus.Paused;
      }
    });

    watch(mediaControls.waiting, () => {
      this._state.status = mediaControls.waiting.value
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
