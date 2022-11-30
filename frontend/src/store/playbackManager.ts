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
import { defineStore } from 'pinia';
import { itemsStore } from '.';
import { useRemote } from '@/composables';

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

export const playbackManagerStore = defineStore('playbackManager', {
  state: () => {
    return {
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
    } as PlaybackManagerState;
  },
  actions: {
    async addToQueue(item: BaseItemDto) {
      const translatedItem = await this.translateItemsForPlayback(item);

      this.queue.push(...translatedItem);
    },
    removeFromQueue(itemId: string) {
      if (this.queue.includes(itemId)) {
        this.queue.splice(this.queue.indexOf(itemId), 1);
      }
    },
    clearQueue(): void {
      this.queue = [];
    },
    changeCurrentTime(time: number | undefined) {
      this.currentTime = time;
    },
    /**
     * Plays an item and initializes playbackManager's state
     */
    async play({
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
        if (this.status !== PlaybackStatus.Stopped) {
          this.stop();
        }

        this.status = PlaybackStatus.Buffering;
        this.queue = await this.translateItemsForPlayback(item, startShuffled);

        if (videoTrackIndex !== undefined) {
          this.currentVideoStreamIndex = videoTrackIndex;
        }

        if (audioTrackIndex !== undefined) {
          this.currentAudioStreamIndex = audioTrackIndex;
        }

        if (subtitleTrackIndex !== undefined) {
          this.currentSubtitleStreamIndex = subtitleTrackIndex;
        }

        this.currentItemIndex = startFromIndex;
        this.currentTime = startFromTime;

        if (!startShuffled && initiator) {
          this.playbackInitMode = InitMode.Item;
        } else if (startShuffled && !initiator) {
          this.playbackInitMode = InitMode.Shuffle;
        } else if (startShuffled && initiator) {
          this.playbackInitMode = InitMode.ShuffleItem;
        } else {
          this.playbackInitMode = InitMode.Unknown;
        }

        this.playbackInitiator = initiator;
        this.status = PlaybackStatus.Playing;
      } catch {
        this.status = PlaybackStatus.Error;
      }
    },
    /**
     * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
     *
     * @param item
     */
    async playNext(item: BaseItemDto): Promise<void> {
      const translatedItem = await this.translateItemsForPlayback(item);

      if (this.currentItemIndex !== undefined) {
        /**
         * Removes the elements that already exists and append the new ones next to the currently playing item
         */
        const newQueue = this.queue.filter(
          (index) => !translatedItem.includes(index)
        );

        newQueue.splice(this.currentItemIndex + 1, 0, ...translatedItem);
        this.setNewQueue(newQueue);
      }
    },
    pause(): void {
      if (this.status === PlaybackStatus.Playing) {
        this.status = PlaybackStatus.Paused;
      }
    },
    unpause(): void {
      if (this.status === PlaybackStatus.Paused) {
        this.status = PlaybackStatus.Playing;
      }
    },
    playPause(): void {
      if (this.status === PlaybackStatus.Playing) {
        this.status = PlaybackStatus.Paused;
      } else if (this.status === PlaybackStatus.Paused) {
        this.status = PlaybackStatus.Playing;
      }
    },
    resetCurrentTime(): void {
      this.currentTime = 0;
    },
    resetCurrentItemIndex(): void {
      this.currentItemIndex = undefined;
    },
    setBuffering(): void {
      this.status = PlaybackStatus.Buffering;
    },
    cancelBuffering(): void {
      this.status = PlaybackStatus.Playing;
    },
    setLastItemIndex(): void {
      this.lastItemIndex = this.currentItemIndex;
    },
    resetLastItemIndex(): void {
      this.lastItemIndex = undefined;
    },
    setVolume(volume: number): void {
      this.currentVolume = volume;

      if (volume === 0) {
        this.isMuted = true;
      } else if (this.isMuted === true) {
        this.isMuted = false;
      }
    },
    setCurrentIndex(index: number) {
      if (this.currentItemIndex !== index) {
        this.lastItemIndex = this.currentItemIndex;
        this.currentItemIndex = index;
        this.currentTime = 0;
      }
    },
    setCurrentTime(time: number | undefined) {
      this.currentTime = time;
    },
    setLastProgressUpdate(progress: number): void {
      this.lastProgressUpdate = progress;
    },
    setMediaSource(mediaSource: MediaSourceInfo): void {
      this.currentMediaSource = mediaSource;
    },
    setPlaySessionId(id: string) {
      this.playSessionId = id;
    },
    setNextTrack(): void {
      this.currentTime = 0;

      if (
        !isNil(this.currentItemIndex) &&
        this.currentItemIndex + 1 < this.queue.length
      ) {
        this.lastItemIndex = this.currentItemIndex;
        this.currentItemIndex += 1;
      } else if (this.repeatMode === RepeatMode.RepeatAll) {
        this.lastItemIndex = this.currentItemIndex;
        this.currentItemIndex = 0;
      } else {
        this.stop();
      }

      /**
       * We set the time again to 0 to avoid jumps in the time slider if there's
       * a timeUpdate event originated by the player while the index switching is taking place
       */
      this.currentTime = 0;
    },
    setPreviousTrack(): void {
      if (
        !isNil(this.currentItemIndex) &&
        this.currentItemIndex > 0 &&
        !isNil(this.currentTime) &&
        this.currentTime < 2
      ) {
        this.currentTime = 0;
        this.lastItemIndex = this.currentItemIndex;
        this.currentItemIndex -= 1;
      } else {
        this.changeCurrentTime(0);
      }
    },
    setMinimized(minimized: boolean) {
      this.isMinimized = minimized;
    },
    setNewQueue(queue: string[]): void {
      let item;
      let lastItem;

      if (this.currentItemIndex !== undefined) {
        item = this.queue[this.currentItemIndex];
      }

      if (this.lastItemIndex !== undefined) {
        lastItem = this.queue[this.lastItemIndex];
      }

      const newIndex = queue?.indexOf(item || '');
      const lastItemNewIndex = queue?.indexOf(lastItem || '');

      this.queue = queue;
      this.lastItemIndex = lastItemNewIndex;
      this.currentItemIndex = newIndex;
    },
    changeItemPosition(itemId: string | undefined, newIndex: number): void {
      if (itemId && this.queue.includes(itemId)) {
        const newQueue = this.queue.filter((index) => index !== itemId);

        newQueue.splice(newIndex, 0, itemId);
        this.setNewQueue(newQueue);
      }
    },
    stop(): void {
      const volume = this.currentVolume;

      this.$reset();
      this.currentVolume = volume;
    },
    skipForward(): void {
      this.changeCurrentTime((this.currentTime || 0) + 15);
    },
    skipBackward(): void {
      if ((this.currentTime || 0) > 15) {
        this.changeCurrentTime((this.currentTime || 0) - 15);
      } else {
        this.changeCurrentTime(0);
      }
    },
    toggleShuffle(): void {
      if (this.queue && !isNil(this.currentItemIndex)) {
        if (!this.isShuffling) {
          const queue = shuffle(this.queue);

          this.originalQueue = this.queue;

          const item = this.queue[this.currentItemIndex];
          const itemIndex = queue.indexOf(item);

          queue.splice(itemIndex, 1);
          queue.unshift(item);

          this.queue = queue;
          this.currentItemIndex = 0;
          this.lastItemIndex = undefined;
          this.isShuffling = true;
        } else {
          const item = this.queue[this.currentItemIndex];

          this.currentItemIndex = this.originalQueue.indexOf(item);
          this.queue = this.originalQueue;
          this.originalQueue = [];
          this.lastItemIndex = undefined;
          this.isShuffling = false;
        }
      }
    },
    /**
     * Toggles between the different repeat modes
     *
     * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
     */
    toggleRepeatMode(): void {
      if (this.repeatMode === RepeatMode.RepeatNone) {
        this.repeatMode =
          this.queue.length > 1 ? RepeatMode.RepeatAll : RepeatMode.RepeatOne;
      } else if (this.repeatMode === RepeatMode.RepeatAll) {
        this.repeatMode =
          this.queue.length > 1 ? RepeatMode.RepeatOne : RepeatMode.RepeatNone;
      } else {
        this.repeatMode = RepeatMode.RepeatNone;
      }
    },
    /**
     * Toggles the mute function
     *
     * If the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
     */
    toggleMute(): void {
      if (this.currentVolume === 0 && this.isMuted) {
        this.currentVolume = 100;
      }

      this.isMuted = !this.isMuted;
    },
    toggleMinimized() {
      this.isMinimized = !this.isMinimized;
    },
    /**
     * Builds an array of item ids based on a collection item (i.e album, tv show, etc...)
     *
     * @param item
     * @param shuffle
     */
    async translateItemsForPlayback(
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
  },
  getters: {
    isBuffering(): boolean {
      return this.status === PlaybackStatus.Buffering;
    },
    isPlaying(): boolean {
      return this.status !== PlaybackStatus.Stopped;
    },
    isRepeating(): boolean {
      return this.repeatMode !== RepeatMode.RepeatNone;
    },
    isPaused(): boolean {
      return this.status === PlaybackStatus.Paused;
    },
    /**
     * Get reactive BaseItemDto's objects of the queue
     */
    getQueueItems(): BaseItemDto[] {
      const items = itemsStore();

      return items.getItemsById(this.queue);
    },
    /**
     * Get a reactive BaseItemDto object of the currently playing item
     */
    getCurrentItem(): BaseItemDto | undefined {
      const items = itemsStore();

      if (!isNil(this.currentItemIndex)) {
        return items.getItemById(this.queue?.[this.currentItemIndex]);
      }
    },
    /**
     * Get a reactive BaseItemDto object of the previous item in queue
     */
    getPreviousItem(): BaseItemDto | undefined {
      const items = itemsStore();

      if (this.currentItemIndex === 0) {
        return undefined;
      } else if (!isNil(this.lastItemIndex)) {
        return items.getItemById(this.queue?.[this.lastItemIndex]);
      }
    },
    /**
     * Get a reactive BaseItemDto object of the next item in queue
     */
    getNextItem(): BaseItemDto | undefined {
      const items = itemsStore();

      if (
        !isNil(this.currentItemIndex) &&
        this.currentItemIndex + 1 < this.queue.length
      ) {
        return items.getItemById(this.queue[this.currentItemIndex + 1]);
      } else if (this.repeatMode === RepeatMode.RepeatAll) {
        return items.getItemById(this.queue?.[0]);
      }
    },
    /**
     * Get the type of the currently playing item
     */
    getCurrentlyPlayingType(): string | null | undefined {
      const items = itemsStore();

      if (!isNil(this.currentItemIndex)) {
        return items.getItemById(this.queue?.[this.currentItemIndex])?.Type;
      }
    },
    /**
     * Get the media type of the currently playing item
     */
    getCurrentlyPlayingMediaType(): string | null | undefined {
      const items = itemsStore();

      if (!isNil(this.currentItemIndex)) {
        return items.getItemById(this.queue?.[this.currentItemIndex])
          ?.MediaType;
      }
    },
    /**
     * Get current's item audio tracks
     */
    getCurrentItemAudioTracks(): MediaStream[] | undefined {
      if (!isNil(this.currentMediaSource?.MediaStreams)) {
        // @ts-expect-error - TODO: Check why typechecking this fails
        return this.currentMediaSource.MediaStreams.filter((stream) => {
          return stream.Type === 'Audio';
        });
      }
    },
    /**
     * Get current's item subtitle tracks
     */
    getCurrentItemSubtitleTracks(): MediaStream[] | undefined {
      if (!isNil(this.currentMediaSource?.MediaStreams)) {
        // @ts-expect-error - TODO: Check why typechecking this fails
        return this.currentMediaSource.MediaStreams.filter((stream) => {
          return stream.Type === 'Subtitle';
        });
      }
    },
    getCurrentItemParsedSubtitleTracks(): PlaybackTrack[] | undefined {
      return (this.currentMediaSource?.MediaStreams?.map((element, index) => ({
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
    },
    getCurrentItemAssParsedSubtitleTracks(): PlaybackTrack[] {
      const subs = this.getCurrentItemParsedSubtitleTracks;

      return (
        subs?.filter((sub) => sub.codec === 'ass' || sub.codec === 'ssa') || []
      );
    },
    getCurrentVideoTrack(): MediaStream | undefined {
      if (
        !isNil(this.currentMediaSource?.MediaStreams) &&
        !isNil(this.currentVideoStreamIndex)
      ) {
        // @ts-expect-error - TODO: Check why typechecking this fails
        return this.currentMediaSource.MediaStreams.filter((stream) => {
          return stream.Type === 'Video';
        })[this.currentVideoStreamIndex];
      }
    },
    getCurrentAudioTrack(): MediaStream | undefined {
      if (
        !isNil(this.currentMediaSource?.MediaStreams) &&
        !isNil(this.currentAudioStreamIndex)
      ) {
        // @ts-expect-error - TODO: Check why typechecking this fails
        return this.currentMediaSource.MediaStreams.filter((stream) => {
          return stream.Type === 'Audio';
        })[this.currentAudioStreamIndex];
      }
    },
    getCurrentSubtitleTrack(): MediaStream | undefined {
      if (
        !isNil(this.currentMediaSource?.MediaStreams) &&
        !isNil(this.currentSubtitleStreamIndex)
      ) {
        // @ts-expect-error - TODO: Check why typechecking this fails
        return this.currentMediaSource.MediaStreams?.filter((stream) => {
          return stream.Type === 'Subtitle';
        })[this.currentSubtitleStreamIndex];
      }
    }
  }
});
