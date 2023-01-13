import { reactive, computed, watch } from 'vue';
import { shuffle, isNil } from 'lodash-es';
import {
  BaseItemDto,
  ChapterInfo,
  ItemFields,
  ItemFilter,
  MediaSourceInfo,
  SubtitleDeliveryMethod,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { itemsStore } from '.';
import { useRemote } from '@/composables';
import { getImageInfo } from '@/utils/images';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { msToTicks } from '@/utils/time';

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

interface PlaybackManagerState {
  status: PlaybackStatus;
  lastItemIndex: number | undefined;
  currentItemIndex: number | undefined;
  currentMediaSource: MediaSourceInfo | undefined;
  currentVideoStreamIndex: number | undefined;
  currentAudioStreamIndex: number | undefined;
  currentSubtitleStreamIndex: number | undefined;
  currentItemChapters: ChapterInfo[] | undefined;
  currentTime: number | undefined;
  lastProgressUpdate: number;
  currentVolume: number;
  isMuted: boolean;
  isShuffling: boolean;
  isMinimized: boolean;
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
const defaultState: PlaybackManagerState = {
  status: PlaybackStatus.Stopped,
  lastItemIndex: undefined,
  currentItemIndex: undefined,
  currentMediaSource: undefined,
  currentVideoStreamIndex: undefined,
  currentAudioStreamIndex: undefined,
  currentSubtitleStreamIndex: undefined,
  currentItemChapters: undefined,
  currentTime: undefined,
  lastProgressUpdate: 0,
  currentVolume: 100,
  isMuted: false,
  isShuffling: false,
  isMinimized: false,
  repeatMode: RepeatMode.RepeatNone,
  queue: [],
  originalQueue: [],
  playSessionId: undefined,
  playbackInitiator: undefined,
  playbackInitMode: InitMode.Unknown
};

const state = reactive<PlaybackManagerState>(defaultState);

class PlaybackManagerStore {
  /**
   * == GETTERS ==
   */
  public get status(): typeof state.status {
    return state.status;
  }
  public isBuffering = computed(
    () => state.status === PlaybackStatus.Buffering
  );
  public isPlaying = computed(() => state.status !== PlaybackStatus.Stopped);
  public isRepeating = computed(
    () => state.repeatMode !== RepeatMode.RepeatNone
  );
  public isPaused = computed(() => state.status === PlaybackStatus.Paused);
  /**
   * Get reactive BaseItemDto's objects of the queue
   */
  public queue = computed(() => {
    const items = itemsStore();

    return items.getItemsById(state.queue);
  });
  /**
   * Get a reactive BaseItemDto object of the currently playing item
   */
  public currentItem = computed(() => {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex]);
    }
  });
  /**
   * Get a reactive BaseItemDto object of the previous item in queue
   */
  public previousItem = computed(() => {
    const items = itemsStore();

    if (!isNil(state.lastItemIndex)) {
      return items.getItemById(state.queue[state.lastItemIndex]);
    }
  });
  /**
   * Get a reactive BaseItemDto object of the next item in queue
   */
  public nextItem = computed(() => {
    const items = itemsStore();

    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      return items.getItemById(state.queue[state.currentItemIndex + 1]);
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      return items.getItemById(state.queue[0]);
    }
  });
  /**
   * Get the type of the currently playing item
   */
  public currentlyPlayingType = computed(() => {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex])?.Type;
    }
  });
  /**
   * Get the media type of the currently playing item
   */
  public currentlyPlayingMediaType = computed(() => {
    const items = itemsStore();

    if (!isNil(state.currentItemIndex)) {
      return items.getItemById(state.queue[state.currentItemIndex])?.MediaType;
    }
  });
  /**
   * Get current's item audio tracks
   */
  public currentItemAudioTracks = computed<MediaStream[] | undefined>(() => {
    if (!isNil(state.currentMediaSource?.MediaStreams)) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Audio';
      });
    }
  });
  /**
   * Get current's item subtitle tracks
   */
  public currentItemSubtitleTracks = computed<MediaStream[] | undefined>(() => {
    if (!isNil(state.currentMediaSource?.MediaStreams)) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Subtitle';
      });
    }
  });

  public currentItemParsedSubtitleTracks = computed<
    PlaybackTrack[] | undefined
  >(() => {
    if (!isNil(state.currentMediaSource)) {
      return (state.currentMediaSource.MediaStreams?.map((element, index) => ({
        srcIndex: index,
        el: element
      }))
        .filter(
          (sub) =>
            (sub.el.Type === 'Subtitle' &&
              sub.el.DeliveryMethod === SubtitleDeliveryMethod.Encode) ||
            sub.el.DeliveryMethod === SubtitleDeliveryMethod.External
        )
        .map((sub) => ({
          label: sub.el.DisplayTitle || 'Undefined',
          src:
            sub.el.DeliveryMethod === SubtitleDeliveryMethod.External
              ? sub.el.DeliveryUrl
              : undefined,
          srcLang: sub.el.Language || undefined,
          type: sub.el.DeliveryMethod as SubtitleDeliveryMethod,
          srcIndex: sub.srcIndex,
          codec: sub.el.Codec
        })) || []) as PlaybackTrack[];
    }
  });

  public currentItemAssParsedSubtitleTracks = computed<PlaybackTrack[]>(() => {
    const subs = this.currentItemParsedSubtitleTracks;

    return (
      subs.value?.filter((sub) => sub.codec === 'ass' || sub.codec === 'ssa') ||
      []
    );
  });

  public currentVideoTrack = computed<MediaStream | undefined>(() => {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentVideoStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Video';
      })[state.currentVideoStreamIndex];
    }
  });

  public currentAudioTrack = computed<MediaStream | undefined>(() => {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentAudioStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Audio';
      })[state.currentAudioStreamIndex];
    }
  });

  public currentSubtitleTrack = computed<MediaStream | undefined>(() => {
    if (
      !isNil(state.currentMediaSource?.MediaStreams) &&
      !isNil(state.currentSubtitleStreamIndex)
    ) {
      return state.currentMediaSource?.MediaStreams.filter((stream) => {
        return stream.Type === 'Subtitle';
      })[state.currentSubtitleStreamIndex];
    }
  });

  /**
   * == ACTIONS ==
   */
  public async addToQueue(item: BaseItemDto): Promise<void> {
    const translatedItem = await this.translateItemsForPlayback(item);

    state.queue.push(...translatedItem);
  }

  public removeFromQueue(itemId: string): void {
    if (state.queue.includes(itemId)) {
      state.queue.splice(state.queue.indexOf(itemId), 1);
    }
  }

  public clearQueue(): void {
    state.queue = [];
  }

  public changeCurrentTime(time: number | undefined): void {
    state.currentTime = time;
  }

  /**
   * Plays an item and initializes playbackManager's state
   */
  public async play({
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
  }): Promise<void> {
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
      state.currentTime = startFromTime;

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
  }

  /**
   * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public async playNext(item: BaseItemDto): Promise<void> {
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
  }

  public pause(): void {
    if (state.status === PlaybackStatus.Playing) {
      state.status = PlaybackStatus.Paused;
    }
  }

  public unpause(): void {
    if (state.status === PlaybackStatus.Paused) {
      state.status = PlaybackStatus.Playing;
    }
  }

  public playPause(): void {
    if (state.status === PlaybackStatus.Playing) {
      state.status = PlaybackStatus.Paused;
    } else if (state.status === PlaybackStatus.Paused) {
      state.status = PlaybackStatus.Playing;
    }
  }

  public resetCurrentTime(): void {
    state.currentTime = 0;
  }

  public resetCurrentItemIndex(): void {
    state.currentItemIndex = undefined;
  }

  public setBuffering(): void {
    state.status = PlaybackStatus.Buffering;
  }

  public cancelBuffering(): void {
    state.status = PlaybackStatus.Playing;
  }

  public setLastItemIndex(): void {
    state.lastItemIndex = state.currentItemIndex;
  }

  public resetLastItemIndex(): void {
    state.lastItemIndex = undefined;
  }

  public setVolume(volume: number): void {
    state.currentVolume = volume;

    if (volume === 0) {
      state.isMuted = true;
    } else if (state.isMuted === true) {
      state.isMuted = false;
    }
  }

  public setCurrentIndex(index: number): void {
    if (state.currentItemIndex !== index) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex = index;
      state.currentTime = 0;
    }
  }

  public setCurrentTime(time: number | undefined): void {
    state.currentTime = time;
  }

  public setLastProgressUpdate(progress: number): void {
    state.lastProgressUpdate = progress;
  }

  public setMediaSource(mediaSource: MediaSourceInfo): void {
    state.currentMediaSource = mediaSource;
  }

  public setPlaySessionId(id: string): void {
    state.playSessionId = id;
  }

  public setNextTrack(): void {
    state.currentTime = 0;

    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex += 1;
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex = 0;
    } else {
      this.stop();
    }

    /**
     * We set the time again to 0 to avoid jumps in the time slider if there's
     * a timeUpdate event originated by the player while the index switching is taking place
     */
    state.currentTime = 0;
  }

  public setPreviousTrack(): void {
    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex > 0 &&
      !isNil(state.currentTime) &&
      state.currentTime < 2
    ) {
      state.currentTime = 0;
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex -= 1;
    } else {
      this.changeCurrentTime(0);
    }
  }

  public setMinimized(minimized: boolean): void {
    state.isMinimized = minimized;
  }

  public setNewQueue(queue: string[]): void {
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
  }

  public changeItemPosition(
    itemId: string | undefined,
    newIndex: number
  ): void {
    if (itemId && state.queue.includes(itemId)) {
      const newQueue = state.queue.filter((index) => index !== itemId);

      newQueue.splice(newIndex, 0, itemId);
      this.setNewQueue(newQueue);
    }
  }

  public async stop(): Promise<void> {
    try {
      if (!isNil(this.currentItem.value) && !isNil(this.currentItem.value.Id)) {
        await reportPlaybackStopped(this.currentItem.value.Id);
      }
    } finally {
      const volume = state.currentVolume;

      Object.assign(state, defaultState);
      state.currentVolume = volume;
    }
  }

  public skipForward(): void {
    this.changeCurrentTime((state.currentTime || 0) + 15);
  }

  public skipBackward(): void {
    if ((state.currentTime || 0) > 15) {
      this.changeCurrentTime((state.currentTime || 0) - 15);
    } else {
      this.changeCurrentTime(0);
    }
  }

  public toggleShuffle(): void {
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
  }

  /**
   * Toggles between the different repeat modes
   *
   * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
   */
  public toggleRepeatMode(): void {
    if (state.repeatMode === RepeatMode.RepeatNone) {
      state.repeatMode =
        state.queue.length > 1 ? RepeatMode.RepeatAll : RepeatMode.RepeatOne;
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      state.repeatMode =
        state.queue.length > 1 ? RepeatMode.RepeatOne : RepeatMode.RepeatNone;
    } else {
      state.repeatMode = RepeatMode.RepeatNone;
    }
  }

  /**
   * Toggles the mute function
   *
   * If the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
   */
  public toggleMute(): void {
    if (state.currentVolume === 0 && state.isMuted) {
      state.currentVolume = 100;
    }

    state.isMuted = !state.isMuted;
  }

  public toggleMinimized(): void {
    state.isMinimized = !state.isMinimized;
  }

  /**
   * Builds an array of item ids based on a collection item (i.e album, tv show, etc...)
   *
   * @param item
   * @param shuffle
   */
  public async translateItemsForPlayback(
    item: BaseItemDto,
    shuffle = false
  ): Promise<string[]> {
    const remote = useRemote();
    let responseItems: BaseItemDto[] = [];

    if (item.Type === 'Program' && item.ChannelId) {
      responseItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            ids: [item.ChannelId],
            limit: 300,
            sortBy: shuffle ? ['Random'] : ['SortName'],
            userId: remote.auth.currentUserId.value,
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
            userId: remote.auth.currentUserId.value,
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
            userId: remote.auth.currentUserId.value,
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
            userId: remote.auth.currentUserId.value,
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
            userId: remote.auth.currentUserId.value,
            fields: Object.values(ItemFields)
          })
        ).data.Items || [];
    } else if (item.Type === 'Episode') {
      if (
        remote.auth.currentUser.value?.Configuration
          ?.EnableNextEpisodeAutoPlay &&
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
              userId: remote.auth.currentUserId.value,
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
  }
}

/**
 * Add or remove media handlers
 */
function handleMediaSession(remove = false): void {
  if (window.navigator.mediaSession) {
    const actionHandlers = {
      play: (): void => {
        playbackManager.unpause();
      },
      pause: (): void => {
        playbackManager.pause();
      },
      previoustrack: (): void => {
        playbackManager.setPreviousTrack();
      },
      nexttrack: (): void => {
        playbackManager.setNextTrack();
      },
      stop: (): void => {
        playbackManager.stop();
      },
      seekbackward: (): void => {
        playbackManager.skipBackward();
      },
      seekforward: (): void => {
        playbackManager.skipForward();
      },
      seekto: (action): void => {
        playbackManager.changeCurrentTime(action.seekTime || 1);
      }
    } as { [key in MediaSessionAction]?: MediaSessionActionHandler };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      try {
        window.navigator.mediaSession.setActionHandler(
          action as MediaSessionAction,
          // eslint-disable-next-line unicorn/no-null
          remove ? null : handler
        );
      } catch {
        console.error(`The media session action "${action}" is not supported.`);
      }
    }
  }
}

/**
 * Updates mediasession metadata based on the currently playing item
 */
const mediaSessionMetadata = computed(() => {
  if (!isNil(playbackManager.currentItem.value)) {
    return new MediaMetadata({
      title: playbackManager.currentItem.value.Name || '',
      artist: playbackManager.currentItem.value.AlbumArtist || '',
      album: playbackManager.currentItem.value.Album || '',
      artwork: [
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 96
            }).url || '',
          sizes: '96x96'
        },
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 128
            }).url || '',
          sizes: '128x128'
        },
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 192
            }).url || '',
          sizes: '192x192'
        },
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 256
            }).url || '',
          sizes: '256x256'
        },
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 384
            }).url || '',
          sizes: '384x384'
        },
        {
          src:
            getImageInfo(playbackManager.currentItem.value, {
              width: 512
            }).url || '',
          sizes: '512x512'
        }
      ]
    });
  }
});

/**
 * Update MediaSession API metadata
 */
function updateMediaSessionMetadata(): void {
  if (window.navigator.mediaSession && !isNil(mediaSessionMetadata.value)) {
    switch (playbackManager.status) {
      case PlaybackStatus.Playing: {
        window.navigator.mediaSession.playbackState = 'playing';
        window.navigator.mediaSession.metadata = mediaSessionMetadata.value;
        break;
      }
      case PlaybackStatus.Paused: {
        window.navigator.mediaSession.playbackState = 'paused';
        window.navigator.mediaSession.metadata = mediaSessionMetadata.value;
        break;
      }
      default: {
        window.navigator.mediaSession.playbackState = 'none';
        // eslint-disable-next-line unicorn/no-null
        window.navigator.mediaSession.metadata = null;
        break;
      }
    }
  }
}

/**
 * Report current item playback progress to server
 */
async function reportPlaybackProgress(): Promise<void> {
  const remote = useRemote();

  if (!isNil(state.currentTime) && !isNil(playbackManager.currentItem.value)) {
    await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackProgress({
      playbackProgressInfo: {
        ItemId: playbackManager.currentItem.value.Id,
        PlaySessionId: state.playSessionId,
        IsPaused: playbackManager.isPaused.value,
        PositionTicks: Math.round(msToTicks(state.currentTime * 1000))
      }
    });

    playbackManager.setLastProgressUpdate(Date.now());
  }
}

/**
 * Report playback stopped to the server. Used by the "Now playing" statistics in other clients.
 */
async function reportPlaybackStopped(itemId: string): Promise<void> {
  const remote = useRemote();

  await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStopped({
    playbackStopInfo: {
      ItemId: itemId,
      PlaySessionId: state.playSessionId,
      PositionTicks: msToTicks((state.currentTime || 0) * 1000)
    }
  });

  playbackManager.setLastProgressUpdate(Date.now());
}

/**
 * Report playback start to the server. Used by the "Now playing" statistics in other clients.
 */
async function reportPlaybackStart(itemId: string): Promise<void> {
  const remote = useRemote();

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

  playbackManager.setLastProgressUpdate(Date.now());
}

/**
 * == WATCHERS ==
 */
watch(
  () => state.status,
  async (newValue, oldValue) => {
    const remove = typeof state.currentItemIndex === 'undefined';

    if (
      newValue === PlaybackStatus.Stopped ||
      oldValue === PlaybackStatus.Error ||
      oldValue === PlaybackStatus.Stopped
    ) {
      handleMediaSession(remove);
    }

    if (!remove) {
      updateMediaSessionMetadata();
      await reportPlaybackProgress();
    }
  }
);

watch(
  () => state.currentItemIndex,
  async () => {
    updateMediaSessionMetadata();

    if (playbackManager.previousItem.value?.Id) {
      await reportPlaybackStopped(playbackManager.previousItem.value.Id);
    }

    /**
     * And then report play for the next one if it exists
     */
    if (
      !isNil(playbackManager.currentItem.value) &&
      !isNil(playbackManager.currentItem.value.Id)
    ) {
      await reportPlaybackStart(playbackManager.currentItem.value.Id);
    }
  }
);

watch(
  () => state.currentTime,
  async () => {
    if (playbackManager.status === PlaybackStatus.Playing) {
      const now = Date.now();

      if (
        playbackManager.currentItem.value &&
        now - state.lastProgressUpdate >= 1250 &&
        !isNil(state.currentTime)
      ) {
        await reportPlaybackProgress();
      }
    }
  }
);

const playbackManager = new PlaybackManagerStore();

export default playbackManager;
