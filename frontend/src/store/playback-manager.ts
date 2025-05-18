/**
 * This store handles the state of the playback
 *
 * It must be used in an agnostic way to cover both local and remote playback.
 * If you want to handle the state of the local player element, use playerElement store instead.
 */
import {
  BaseItemKind,
  ItemFilter,
  ItemSortBy,
  MediaStreamType,
  type BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { getInstantMixApi } from '@jellyfin/sdk/lib/utils/api/instant-mix-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { computedAsync, watchThrottled } from '@vueuse/core';
import { computed, watch, watchEffect } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { useBaseItem } from '#/composables/apis';
import { useSnackbar } from '#/composables/use-snackbar';
import { remote } from '#/plugins/remote';
import { apiStore } from '#/store/dbs/api';
import { getImageInfo } from '#/utils/images';
import { getItemRuntime } from '#/utils/items';
import playbackProfile from '#/utils/playback-profiles';
import { msToTicks } from '#/utils/time';
import { mediaControls, mediaElementRef } from '#/store';
import { CommonStore } from '#/store/super/common-store';
import { runGenericWorkerFunc } from '#/plugins/workers';

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

interface PlaybackManagerState {
  status: PlaybackStatus;
  currentItemIndex?: number;
  mediaSourceIndexes: {
    source?: number;
    video?: number;
    audio?: number;
    subtitle?: number;
  };
  remotePlaybackTime: number;
  remoteCurrentVolume: number;
  isRemotePlayer: boolean;
  isRemoteMuted: boolean;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  queue: string[];
  originalQueue: string[];
  playSessionId?: string | null;
  playbackInitiatorId?: BaseItemDto['Id'];
  playbackInitMode: InitMode;
  playbackSpeed: number;
}

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class PlaybackManagerStore extends CommonStore<PlaybackManagerState> {
  /**
   * == NON REACTIVE STATE AND UTILITY VARIABLES ==
   * Reactive state is defined in the super() constructor
   */
  /**
   * Amount of time to wait between playback reports
   */
  private readonly _progressReportInterval = 3500;
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly status = computed(() => this._state.value.status);
  public readonly queueLength = computed(() => this._state.value.queue.length);
  public readonly repeatMode = computed(() => this._state.value.repeatMode);
  public readonly isBuffering = computed(() => this.status.value === PlaybackStatus.Buffering);
  public readonly isPlaying = computed(() => this.status.value !== PlaybackStatus.Stopped);
  public readonly isPaused = computed(() => this.status.value === PlaybackStatus.Paused);
  public readonly isRepeating = computed(() => this._state.value.repeatMode !== RepeatMode.RepeatNone);
  public readonly isShuffling = computed(() => this._state.value.isShuffling);
  public readonly isRepeatingAll = computed(() => this._state.value.repeatMode === RepeatMode.RepeatAll);
  public readonly isRepeatingOnce = computed(() => this._state.value.repeatMode === RepeatMode.RepeatOne);
  public readonly isRemotePlayer = computed(() => this._state.value.isRemotePlayer);
  public readonly playbackInitMode = computed(() => this._state.value.playbackInitMode);
  public readonly isMuted = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.isRemoteMuted
      : mediaControls.muted.value,
    set: (newValue: boolean) => {
      if (this.isRemotePlayer.value) {
        this._state.value.isRemoteMuted = newValue;
      } else {
        mediaControls.muted.value = newValue;
      }
    }
  });

  /**
   * Map ids into BaseItemDto's objects of the queue
   */
  public readonly queue = computedAsync(async () => await apiStore.getItemsById(this._state.value.queue) as BaseItemDto[], []);
  public readonly initiator = computedAsync(async () => await apiStore.getItemById(this._state.value.playbackInitiatorId));
  public readonly currentItemIndex = computed({
    get: () => this._state.value.currentItemIndex,
    set: (newIndex: number | undefined) => {
      this._state.value.currentItemIndex = newIndex;
      this.currentTime.value = 0;
    }
  });

  public readonly currentItemId = computed(() => this._state.value.queue[this.currentItemIndex.value ?? -1]);
  public readonly currentItem = computed<BaseItemDto | undefined>(() =>
    this.queue.value[this.currentItemIndex.value ?? -1]
  );

  public readonly currentMediaSourceIndex = computed(() => this._state.value.mediaSourceIndexes.source);
  public readonly currentMediaSource = computed(() => this.currentItem.value?.MediaSources?.[this.currentMediaSourceIndex.value ?? 0]);
  public readonly currentVideoTrack = computed({
    get: () => {
      if (!isNil(this._state.value.mediaSourceIndexes.video)
      ) {
        return this.currentMediaSource.value?.MediaStreams?.find(
          stream =>
            stream.Type === MediaStreamType.Video
            && stream.Index === this._state.value.mediaSourceIndexes.video
        );
      }
    },
    set: (newIndex: number) => this._state.value.mediaSourceIndexes.video = newIndex
  });

  public readonly currentAudioTrack = computed({
    get: () => {
      if (!isNil(this._state.value.mediaSourceIndexes.audio)
      ) {
        return this.currentMediaSource.value?.MediaStreams?.find(
          stream =>
            stream.Type === MediaStreamType.Audio
            && stream.Index === this._state.value.mediaSourceIndexes.audio
        );
      }
    },
    set: (newIndex: number) => this._state.value.mediaSourceIndexes.audio = newIndex
  });

  public readonly currentSubtitleTrack = computed({
    get: () => {
      if (!isNil(this._state.value.mediaSourceIndexes.subtitle)
      ) {
        return this.currentMediaSource.value?.MediaStreams?.find(
          stream =>
            stream.Type === MediaStreamType.Subtitle
            && stream.Index === this._state.value.mediaSourceIndexes.subtitle
        );
      }
    },
    set: (newIndex: number) => this._state.value.mediaSourceIndexes.subtitle = newIndex
  });

  /**
   * In milliseconds
   */
  public readonly currentItemRuntime = computed(() => this.currentItem.value ? getItemRuntime(this.currentItem.value) : 0);
  /**
   * In seconds
   */
  public readonly currentTime = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.remotePlaybackTime
      : mediaControls.currentTime.value,
    set: (newValue: number) => {
      if (this.isRemotePlayer.value) {
        this._state.value.remotePlaybackTime = newValue;
      } else {
        mediaControls.currentTime.value = newValue;
      }
    }
  });

  public readonly currentVolume = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.remoteCurrentVolume
      : mediaControls.volume.value * 100,
    set: (newVolume: number) => {
      newVolume = Math.min(newVolume, 100);
      this.isMuted.value = newVolume === 0;

      if (this.isRemotePlayer.value) {
        this._state.value.remoteCurrentVolume = newVolume;
      } else {
        mediaControls.volume.value = newVolume / 100;
      }
    }
  });

  private readonly _currentPlaybackInfo = computedAsync(async (
  ) => {
    if (this.currentItem.value?.Id
      && this.currentMediaSource.value?.Id
      && remote.auth.currentUserId.value
    ) {
      return (
        await remote.sdk.newUserApi(getMediaInfoApi).getPostedPlaybackInfo({
          itemId: this.currentItem.value.Id,
          userId: remote.auth.currentUserId.value,
          autoOpenLiveStream: true,
          playbackInfoDto: { DeviceProfile: playbackProfile },
          mediaSourceId: this.currentMediaSource.value.Id,
          audioStreamIndex: this._state.value.mediaSourceIndexes.audio,
          subtitleStreamIndex: this._state.value.mediaSourceIndexes.subtitle
        })
      ).data;
    }
  },
  undefined,
  {
    onError: () => {
      this._state.value.status = PlaybackStatus.Error;
      useSnackbar(i18next.t('cantPlayItem'), 'error');
    }
  }
  );

  public readonly currentSourceUrl = computed(() =>
    this.getItemPlaybackUrl(this._currentPlaybackInfo.value?.MediaSources?.[0])
  );

  private readonly _previousItemIndex = computed(() => {
    if (this.isRepeatingAll.value && this._state.value.currentItemIndex === 0) {
      return this.queueLength.value - 1;
    } else if (!isNil(this._state.value.currentItemIndex)) {
      return this._state.value.currentItemIndex - 1;
    }
  });

  public readonly previousItem = computed(() => this.queue.value[this._previousItemIndex.value ?? -1]);

  private readonly _nextItemIndex = computed(() => {
    if (this.isRepeatingAll.value && this._state.value.currentItemIndex === this.queueLength.value - 1) {
      return 0;
    } else if (!isNil(this._state.value.currentItemIndex)) {
      return this._state.value.currentItemIndex + 1;
    }
  });

  public readonly nextItem = computed(() => this.queue.value[this._nextItemIndex.value ?? -1]);

  /**
   * Get the types of the currently playing item
   */
  public readonly currentlyPlayingMediaType = computed(() => this.currentItem.value?.MediaType);
  public readonly currentlyPlayingType = computed(() => this.currentItem.value?.Type);
  public readonly isVideo = computed(() => this.currentlyPlayingMediaType.value === 'Video');
  public readonly isAudio = computed(() => this.currentlyPlayingMediaType.value === 'Audio');

  /**
   * Get the media type of the currently playing item
   */
  private readonly _currentlyPlayingMediaType = computedAsync(async () =>
    (await apiStore.getItemById(this.currentItemId.value))
      ?.MediaType
  );

  /**
   * Get current's item audio tracks
   */
  public readonly currentItemAudioTracks = computed(() =>
    this.currentMediaSource.value?.MediaStreams?.filter(
      stream => stream.Type === MediaStreamType.Audio
    )
  );

  /**
   * Get current's item subtitle tracks
   */
  public readonly currentItemSubtitleTracks = computed(() =>
    this.currentMediaSource.value?.MediaStreams?.filter(
      stream => stream.Type === MediaStreamType.Subtitle
    )
  );

  public readonly playbackSpeed = computed({
    get: () => this._state.value.playbackSpeed,
    set: (newSpeed: number) => {
      this._state.value.playbackSpeed = newSpeed;
    }
  });

  /**
   * == ACTIONS ==
   */
  /**
   * Report current item playback progress to server
   */
  private readonly _reportPlaybackProgress = async (): Promise<void> => {
    if (!isNil(this.currentTime.value) && !isNil(this.currentItem.value)) {
      await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackProgress({
        playbackProgressInfo: {
          ItemId: this.currentItem.value.Id,
          PlaySessionId: this._state.value.playSessionId,
          IsPaused: this.isPaused.value,
          PositionTicks: Math.round(msToTicks(this.currentTime.value * 1000))
        }
      });
    }
  };

  /**
   * Report playback stopped to the server. Used by the "Now playing" statistics in other clients.
   */
  private readonly _reportPlaybackStopped = async (
    itemId = this.currentItemId.value,
    sessionId = this._state.value.playSessionId,
    currentTime = this.currentTime.value
  ): Promise<void> => {
    await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStopped({
      playbackStopInfo: {
        ItemId: itemId,
        PlaySessionId: sessionId,
        PositionTicks: msToTicks((currentTime || 0) * 1000)
      }
    });
  };

  /**
   * Report playback start to the server. Used by the "Now playing" statistics in other clients.
   */
  private readonly _reportPlaybackStart = async (itemId: string): Promise<void> => {
    await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStart({
      playbackStartInfo: {
        CanSeek: true,
        ItemId: itemId,
        PlaySessionId: this._state.value.playSessionId,
        MediaSourceId: this.currentMediaSource.value?.Id,
        AudioStreamIndex: this._state.value.mediaSourceIndexes.audio,
        SubtitleStreamIndex: this._state.value.mediaSourceIndexes.subtitle
      }
    });
  };

  public readonly queueHasItem = (itemId: string): boolean => this._state.value.queue.includes(itemId);
  public readonly addToQueue = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    this._state.value.queue.push(...translatedItem);
  };

  public readonly removeFromQueue = (itemId: string): void => {
    if (this.queueHasItem(itemId)) {
      this._state.value.queue.splice(this._state.value.queue.indexOf(itemId), 1);
    }
  };

  public readonly clearQueue = (): void => {
    this._state.value.queue = [];
  };

  /**
   * Plays an item and initializes playbackManager's state
   */
  public readonly play = async ({
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
      if (this._state.value.status !== PlaybackStatus.Stopped) {
        this.stop();
      }

      this._state.value.status = PlaybackStatus.Buffering;
      this._state.value.queue = await this.translateItemsForPlayback(item);
      this._state.value.mediaSourceIndexes.source = mediaSourceIndex;
      this._state.value.mediaSourceIndexes.video = videoTrackIndex;
      this._state.value.mediaSourceIndexes.audio = audioTrackIndex;
      this._state.value.mediaSourceIndexes.subtitle = subtitleTrackIndex;
      this._state.value.currentItemIndex = startFromIndex;

      if (startShuffled) {
        await this.toggleShuffle(false);
      }

      this.currentTime.value = startFromTime;

      if (!startShuffled && initiator) {
        this._state.value.playbackInitMode = InitMode.Item;
      } else if (startShuffled && !initiator) {
        this._state.value.playbackInitMode = InitMode.Shuffle;
      } else if (startShuffled && initiator) {
        this._state.value.playbackInitMode = InitMode.ShuffleItem;
      } else {
        this._state.value.playbackInitMode = InitMode.Unknown;
      }

      this._state.value.playbackInitiatorId = initiator?.Id;

      this._state.value.status = PlaybackStatus.Playing;
    } catch {
      this._state.value.status = PlaybackStatus.Error;
    }
  };

  /**
   * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public readonly playNext = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    if (!isNil(this.currentItemIndex.value)) {
      /**
       * Removes the elements that already exists and append the new ones next to the currently playing item
       */
      const newQueue = this._state.value.queue.filter(
        index => !translatedItem.includes(index)
      );

      newQueue.splice(this.currentItemIndex.value + 1, 0, ...translatedItem);
      this.setNewQueue(newQueue);
    }
  };

  public readonly pause = (): void => {
    if (this._state.value.status === PlaybackStatus.Playing) {
      this._state.value.status = PlaybackStatus.Paused;
    }
  };

  public readonly unpause = (): void => {
    if (this._state.value.status === PlaybackStatus.Paused) {
      this._state.value.status = PlaybackStatus.Playing;
    }
  };

  public readonly playPause = (): void => {
    if (this._state.value.status === PlaybackStatus.Playing) {
      this.pause();
    } else if (this._state.value.status === PlaybackStatus.Paused) {
      this.unpause();
    }
  };

  public readonly setNextItem = (): void => {
    if (this.nextItem.value) {
      this.currentItemIndex.value = this._nextItemIndex.value;
    } else {
      this.stop();
    }

    this.currentTime.value = 0;
  };

  /**
   * Restarts the current item by default. It will go to the previous item only if the
   * current time is below 5 seconds.
   *
   * @param force - If true, it will change to the previous item (if it exists)
   * regardless of runtime.
   */
  public readonly setPreviousItem = (force = false): void => {
    if (!isNil(this.previousItem) && (force || this.currentTime.value < 5)) {
      this.currentItemIndex.value = this._previousItemIndex.value;
    }

    this.currentTime.value = 0;
  };

  public readonly setNewQueue = (queue: string[]): void => {
    if (this.currentItemId.value) {
      const newIndex = queue.indexOf(this.currentItemId.value);

      this._state.value.queue = queue;
      this._state.value.currentItemIndex = newIndex;
    }
  };

  public readonly changeItemPosition = (
    itemId: string | undefined,
    newIndex: number
  ): void => {
    if (itemId && this.queueHasItem(itemId)) {
      const newQueue = this._state.value.queue.filter(id => id !== itemId);

      newQueue.splice(newIndex, 0, itemId);
      this.setNewQueue(newQueue);
    }
  };

  public readonly stop = (): void => {
    const sessionId = String(this._state.value.playSessionId ?? '');
    const time = Number(this.currentTime.value);
    const itemId = String(this.currentItem.value?.Id ?? '');
    const volume = Number(this.currentVolume.value);

    this._reset();
    this.currentVolume.value = volume;

    void this._reportPlaybackStopped(itemId, sessionId, time);
  };

  /**
   * Seek forward 15 seconds
   */
  public readonly skipForward = (): void => {
    this.currentTime.value = (this.currentTime.value || 0) + 15;
  };

  /**
   * Seek backwards 15 seconds
   */
  public readonly skipBackward = (): void => {
    this.currentTime.value
      = (this.currentTime.value || 0) > 15 ? (this.currentTime.value || 0) - 15 : 0;
  };

  /**
   * Increase volume by 5
   */
  public readonly volumeUp = (): void => {
    this.currentVolume.value = this.currentVolume.value + 5;
  };

  /**
   * Decrease volume by 5
   */
  public readonly volumeDown = (): void => {
    this.currentVolume.value = this.currentVolume.value - 5;
  };

  public readonly toggleShuffle = async (preserveCurrentItem = true): Promise<void> => {
    if (!isNil(this.currentItemId.value)) {
      if (this._state.value.isShuffling) {
        this._state.value.currentItemIndex = this._state.value.originalQueue.indexOf(this.currentItemId.value);
        this._state.value.queue = this._state.value.originalQueue;
        this._state.value.originalQueue = [];
        this._state.value.isShuffling = false;
      } else {
        const shuffled_queue
          = await runGenericWorkerFunc('shuffle')(this._state.value.queue) as string[];

        this._state.value.originalQueue = this._state.value.queue;

        if (preserveCurrentItem) {
          const itemIndex = shuffled_queue.indexOf(this.currentItemId.value);

          shuffled_queue.splice(itemIndex, 1);
          shuffled_queue.unshift(this.currentItemId.value);
        }

        this._state.value.queue = shuffled_queue;
        this._state.value.currentItemIndex = 0;
        this._state.value.isShuffling = true;
      }
    }
  };

  /**
   * Toggles between the different repeat modes
   *
   * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
   */
  public readonly toggleRepeatMode = (): void => {
    if (this._state.value.repeatMode === RepeatMode.RepeatNone) {
      this._state.value.repeatMode
        = this.queueLength.value > 1
          ? RepeatMode.RepeatAll
          : RepeatMode.RepeatOne;
    } else if (this._state.value.repeatMode === RepeatMode.RepeatAll) {
      this._state.value.repeatMode
        = this.queueLength.value > 1
          ? RepeatMode.RepeatOne
          : RepeatMode.RepeatNone;
    } else {
      this._state.value.repeatMode = RepeatMode.RepeatNone;
    }
  };

  /**
   * Toggles the mute function
   *
   * If the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
   */
  public readonly toggleMute = (): void => {
    if (this.currentVolume.value === 0 && this.isMuted.value) {
      this.currentVolume.value = 100;
    }

    this.isMuted.value = !this.isMuted.value;
  };

  public readonly instantMixFromItem = async (itemId: string): Promise<void> => {
    const { data: items } = await useBaseItem(
      getInstantMixApi,
      'getInstantMixFromItem',
      { skipCache: { request: true } })(() => ({
      itemId
    }));

    for (const item of items.value) {
      await this.addToQueue(item);
    }
  };

  /**
   * Builds an array of item ids based on a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public readonly translateItemsForPlayback = async (
    item: BaseItemDto
  ): Promise<string[]> => {
    if (!item.Id) {
      return [];
    }

    const sortOrder
      = item.Type === BaseItemKind.Playlist || item.Type === BaseItemKind.BoxSet
        ? undefined
        : [ItemSortBy.SortName];
    const ids
      = item.Type === BaseItemKind.Program && item.ChannelId
        ? [item.ChannelId]
        : undefined;
    const artistIds
      = item.Type === BaseItemKind.MusicArtist ? [item.Id] : undefined;
    const parentId = item.IsFolder ? item.Id : undefined;
    let request: BaseItemDto[] = [];

    if (
      item.Type === BaseItemKind.Program
      || item.Type === BaseItemKind.Playlist
      || item.Type === BaseItemKind.MusicArtist
      || item.Type === BaseItemKind.MusicGenre
      || item.IsFolder
    ) {
      const { data: response } = await useBaseItem(getItemsApi, 'getItems')(() => ({
        ids,
        artistIds,
        filters: [ItemFilter.IsNotFolder],
        parentId,
        recursive: true,
        sortBy: sortOrder
      }));

      request = response.value;
    } else if (
      item.Type === BaseItemKind.Episode
      && remote.auth.currentUser.value?.Configuration?.EnableNextEpisodeAutoPlay
      && item.SeriesId
    ) {
      /**
       * If autoplay is enabled and we have a seriesId, get the rest of the episodes
       */
      const { data: response } = await useBaseItem(getTvShowsApi, 'getEpisodes')(() => ({
        seriesId: item.SeriesId!,
        isMissing: false,
        startItemId: item.Id
      }));

      request = response.value;
    }

    /** If no extra processing was needed, we add the item itself */
    if (request.length === 0) {
      request.push(item);
    }

    return request.map(i => i.Id!);
  };

  public readonly getItemPlaybackUrl = (
    mediaSource = this.currentMediaSource.value,
    mediaType = this._currentlyPlayingMediaType.value
  ): string | undefined => {
    if (
      remote.sdk.api?.basePath
      && remote.auth.currentUserToken.value
      && mediaType
      && mediaSource
      && mediaSource.SupportsDirectStream
      && mediaSource.Type
      && mediaSource.Id
      && mediaSource.Container
    ) {
      const directOptions: Record<string, string> = {
        Static: String(true),
        mediaSourceId: mediaSource.Id,
        deviceId: remote.sdk.deviceInfo.id,
        api_key: remote.auth.currentUserToken.value,
        Tag: mediaSource.ETag ?? '',
        LiveStreamId: mediaSource.LiveStreamId ?? ''
      };

      const parameters = new URLSearchParams(directOptions).toString();

      if (mediaType === 'Video') {
        // @ts-expect-error - There's an API mismatch here
        mediaType = 'Videos';
      }

      return `${remote.sdk.api.basePath}/${mediaType}/${mediaSource.Id}/stream.${mediaSource.Container}?${parameters}`;
    } else if (remote.sdk.api?.basePath && mediaSource?.SupportsTranscoding && mediaSource.TranscodingUrl) {
      return `${remote.sdk.api.basePath}${mediaSource.TranscodingUrl}`;
    }
  };

  public constructor() {
    super({
      storeKey: 'playbackManager',
      defaultState: () => ({
        status: PlaybackStatus.Stopped,
        currentItemIndex: undefined,
        mediaSourceIndexes: {
          source: undefined,
          video: undefined,
          audio: undefined,
          subtitle: undefined
        },
        remotePlaybackTime: 0,
        remoteCurrentVolume: 100,
        isRemotePlayer: false,
        isRemoteMuted: false,
        isShuffling: false,
        repeatMode: RepeatMode.RepeatNone,
        queue: [],
        originalQueue: [],
        playSessionId: undefined,
        playbackInitiatorId: undefined,
        playbackInitMode: InitMode.Unknown,
        playbackSpeed: 1
      })
    });
    /**
     * Logic is divided by concerns and scope. Watchers for callbacks
     * that rely on the same variables might not be together. Categories:
     * - Status
     * - MediaSession
     * - Server interaction: Setting media sources and playback reporting
     * - Local media controls: Media element status changes performed outside this store.
     *   For example: The browser itself might expose direct controls to the underlying HTMLMediaElement.
     *   We want to keep track of these changes as well.
     */
    /**
     * == Status ==
     */
    watch(this.status,
      () => {
        if (
          this.status.value === PlaybackStatus.Playing
          && !mediaControls.playing.value
        ) {
          mediaControls.playing.value = true;
        } else if (
          this.status.value === PlaybackStatus.Paused
          && mediaControls.playing.value
        ) {
          mediaControls.playing.value = false;
        }
      }
    );

    /**
     * == MediaSession API: https://developer.mozilla.org/en-US/docs/Web/API/MediaSession ==
     */
    watchEffect(() => {
      const { t } = i18next;

      globalThis.navigator.mediaSession.metadata = this.currentItem.value
        ? new MediaMetadata({
          title: this.currentItem.value.Name ?? t('unknownTitle'),
          artist: this.currentItem.value.AlbumArtist ?? t('unknownArtist'),
          album: this.currentItem.value.Album ?? t('unknownAlbum'),
          artwork: [96, 128, 192, 256, 384, 512].map(size => ({
            src:
                getImageInfo(this.currentItem.value!, {
                  width: size
                }).url ?? '',
            sizes: `${size}x${size}`
          }))
        })
      /* eslint-disable-next-line unicorn/no-null */
        : null;
    });
    watchEffect(() => {
      switch (this.status.value) {
        case PlaybackStatus.Playing: {
          globalThis.navigator.mediaSession.playbackState = 'playing';
          break;
        }
        case PlaybackStatus.Paused:
        case PlaybackStatus.Buffering: {
          globalThis.navigator.mediaSession.playbackState = 'paused';
          break;
        }
        default: {
          globalThis.navigator.mediaSession.playbackState = 'none';
        }
      }
    });
    watch(this.status,
      async (newValue, oldValue) => {
        const remove
          = newValue === PlaybackStatus.Error
            || newValue === PlaybackStatus.Stopped;
        const add
          = oldValue === PlaybackStatus.Error
            || oldValue === PlaybackStatus.Stopped;

        if (remove || add) {
          const actionHandlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
            play: this.unpause,
            pause: this.pause,
            previoustrack: () => { this.setPreviousItem(); },
            nexttrack: this.setNextItem,
            stop: this.stop,
            seekbackward: this.skipBackward,
            seekforward: this.skipForward,
            seekto: (action): void => {
              this.currentTime.value = action.seekTime ?? 0;
            }
          };

          for (const action in actionHandlers) {
            try {
              globalThis.navigator.mediaSession.setActionHandler(
                action as MediaSessionAction,
                /* eslint-disable-next-line unicorn/no-null */
                add ? actionHandlers[action as keyof typeof actionHandlers] ?? null : null
              );
            } catch {
              console.error(
                `The media session action "${action}" is not supported.`
              );
            }
          }

          await this._reportPlaybackProgress();
        }
      }
    );
    watchEffect(() => {
      const remove
        = this.status.value === PlaybackStatus.Error
          || this.status.value === PlaybackStatus.Stopped;

      if (this.currentTime.value <= this.currentItemRuntime.value) {
        const duration = this.currentItemRuntime.value / 1000;

        globalThis.navigator.mediaSession.setPositionState(
          remove
            ? undefined
            : {
                duration,
                playbackRate: this.playbackSpeed.value,
                position: this.currentTime.value <= duration ? this.currentTime.value : 0
              }
        );
      }
    });

    /**
     * == Server interaction ==
     */
    /**
     * Report stop for the old item and start for the new one
     */
    watch(this.currentItemId,
      async (newValue, oldValue) => {
        if (oldValue) {
          /**
           * We pass the currentTime to ensure the playback stop is reported with the correct time and not 0
           */
          await this._reportPlaybackStopped(oldValue, undefined, this.currentTime.value);
        }

        if (newValue) {
          await this._reportPlaybackStart(newValue);
        }
      }
    );

    /**
     * Set play session id when the playback info is updated
     */
    watch(this._currentPlaybackInfo, () => {
      this._state.value.playSessionId = this._currentPlaybackInfo.value?.PlaySessionId;

      if (this._currentPlaybackInfo.value?.ErrorCode) {
        this._state.value.status = PlaybackStatus.Error;
      }
    });

    watchThrottled(
      this.currentTime,
      this._reportPlaybackProgress,
      { throttle: this._progressReportInterval }
    );
    watch(this.status, this._reportPlaybackProgress);

    /**
     * Report playback stop when closing the tab
     */
    globalThis.addEventListener('beforeunload', () => {
      if (this.currentItemId.value) {
        void this._reportPlaybackStopped(this.currentItemId.value);
      }
    });

    /**
     * == Local media controls ==
     */

    watch(mediaControls.playing, () => {
      if (
        this.status.value !== PlaybackStatus.Buffering
        && !this.isRemotePlayer.value
      ) {
        this._state.value.status = mediaControls.playing.value
          ? PlaybackStatus.Playing
          : PlaybackStatus.Paused;
      }
    });

    watch(mediaControls.waiting, () => {
      if (!this.isRemotePlayer.value) {
        this._state.value.status = mediaControls.waiting.value
          ? PlaybackStatus.Buffering
          : PlaybackStatus.Playing;
      }
    });

    watch(mediaControls.ended, () => {
      if (mediaControls.ended.value && !this.isRemotePlayer.value) {
        this.setNextItem();
      }
    });

    watch(this.playbackSpeed, () => {
      mediaControls.rate.value = this.playbackSpeed.value;

      if (mediaElementRef.value) {
        mediaElementRef.value.preservesPitch = true;
      }
    });

    /**
     * Report playback stop before logging out
     */
    remote.auth.onBeforeLogout(
      async () => {
        await this._reportPlaybackStopped(this.currentItemId.value);
        this._reset();
      }
    );
  }
}

export const playbackManager = new PlaybackManagerStore();
