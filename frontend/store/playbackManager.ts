import { ActionTree, GetterTree, MutationTree } from 'vuex';
import shuffle from 'lodash/shuffle';
import {
  BaseItemDto,
  ChapterInfo,
  MediaSourceInfo,
  SubtitleDeliveryMethod
} from '@jellyfin/client-axios';
import isNil from 'lodash/isNil';
import { RootState } from '.';

export enum PlaybackStatus {
  Stopped,
  Playing,
  Paused,
  Error
}

export enum RepeatMode {
  RepeatNone = 'RepeatNone',
  RepeatOne = 'RepeatOne',
  RepeatAll = 'RepeatAll'
}

export enum InitMode {
  Unknown,
  Shuffle,
  Item,
  ShuffleItem
}

export interface PlaybackTrack {
  label: string;
  src?: string;
  srcLang?: string;
  srcIndex: number;
  type: SubtitleDeliveryMethod;
  codec?: string;
}

export interface PlaybackManagerState {
  status: PlaybackStatus;
  lastItemIndex: number | null;
  currentItemIndex: number | null;
  currentMediaSource: MediaSourceInfo | null;
  currentVideoStreamIndex: number | undefined;
  currentAudioStreamIndex: number | undefined;
  currentSubtitleStreamIndex: number | undefined;
  currentItemChapters: ChapterInfo[] | null;
  currentTime: number | null;
  lastProgressUpdate: number;
  currentVolume: number;
  isFullscreen: boolean;
  isMuted: boolean;
  isShuffling: boolean;
  isMinimized: boolean;
  repeatMode: RepeatMode;
  queue: readonly string[];
  originalQueue: readonly string[];
  playSessionId: string | null;
  playbackInitiator: BaseItemDto | null;
  playbackInitMode: InitMode;
}

export const defaultState = (): PlaybackManagerState => ({
  status: PlaybackStatus.Stopped,
  lastItemIndex: null,
  currentItemIndex: null,
  currentMediaSource: null,
  currentVideoStreamIndex: undefined,
  currentAudioStreamIndex: undefined,
  currentSubtitleStreamIndex: undefined,
  currentItemChapters: null,
  currentTime: null,
  lastProgressUpdate: 0,
  currentVolume: 100,
  isFullscreen: false,
  isMuted: false,
  isShuffling: false,
  isMinimized: false,
  repeatMode: RepeatMode.RepeatNone,
  queue: [],
  originalQueue: [],
  playSessionId: null,
  playbackInitiator: null,
  playbackInitMode: InitMode.Unknown
});

export const state = defaultState;

export const getters: GetterTree<PlaybackManagerState, RootState> = {
  getQueueItems: (state, _getters, _rootState, rootGetters) => {
    return rootGetters['items/getItems'](state.queue);
  },
  getCurrentItem: (state, _getters, _rootState, rootGetters) => {
    if (!isNil(state.currentItemIndex) && state.queue[state.currentItemIndex]) {
      return rootGetters['items/getItem'](state.queue[state.currentItemIndex]);
    }

    return null;
  },
  getPreviousItem: (state, _getters, _rootState, rootGetters) => {
    if (state.currentItemIndex === 0) {
      return null;
    } else if (
      !isNil(state.lastItemIndex) &&
      state.queue[state.lastItemIndex]
    ) {
      return rootGetters['items/getItem'](state.queue[state.lastItemIndex]);
    }

    return null;
  },
  getNextItem: (state, _getters, _rootState, rootGetters) => {
    if (
      !isNil(state.currentItemIndex) &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      return rootGetters['items/getItem'](
        state.queue[state.currentItemIndex + 1]
      );
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      return rootGetters['items/getItem'](state.queue[0]);
    }

    return null;
  },
  getCurrentlyPlayingType: (state, _getters, _rootState, rootGetters) => {
    if (!isNil(state.currentItemIndex)) {
      return rootGetters['items/getItem'](state.queue?.[state.currentItemIndex])
        ?.Type;
    }

    return null;
  },
  getCurrentlyPlayingMediaType: (state, _getters, _rootState, rootGetters) => {
    if (!isNil(state.currentItemIndex)) {
      return rootGetters['items/getItem'](state.queue?.[state.currentItemIndex])
        ?.MediaType;
    }

    return null;
  },
  getCurrentItemAudioTrack: (state) => {
    if (!isNil(state.currentMediaSource)) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Audio';
      });
    }
  },
  getCurrentItemSubtitleTracks: (state) => {
    if (!isNil(state.currentMediaSource)) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Subtitle';
      });
    }
  },
  getCurrentItemParsedSubtitleTracks: (state) => {
    return (state.currentMediaSource?.MediaStreams?.map((el, idx) => ({
      srcIndex: idx,
      el
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
  getCurrentItemVttParsedSubtitleTracks: (_state, getters) => {
    const subs: PlaybackTrack[] = getters.getCurrentItemParsedSubtitleTracks;

    return (
      subs.filter((sub) => sub.src && sub.src.match(/Stream\.vtt(\?.*)?$/)) ||
      []
    );
  },
  getCurrentItemAssParsedSubtitleTracks: (_state, getters) => {
    const subs: PlaybackTrack[] = getters.getCurrentItemParsedSubtitleTracks;

    return (
      subs.filter((sub) => sub.codec === 'ass' || sub.codec === 'ssa') || []
    );
  },
  getCurrentVideoTrack: (state) => {
    if (
      !isNil(state.currentMediaSource) &&
      !isNil(state.currentVideoStreamIndex)
    ) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Video';
      })[state.currentVideoStreamIndex];
    }

    return null;
  },
  getCurrentAudioTrack: (state) => {
    if (
      !isNil(state.currentMediaSource) &&
      !isNil(state.currentAudioStreamIndex)
    ) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Audio';
      })[state.currentAudioStreamIndex];
    }

    return null;
  },
  getCurrentSubtitleTrack: (state) => {
    if (
      !isNil(state.currentMediaSource) &&
      !isNil(state.currentSubtitleStreamIndex)
    ) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Subtitle';
      })[state.currentSubtitleStreamIndex];
    }

    return null;
  }
};

interface QueueMutationPayload {
  queue: string[];
}

interface CurrentItemIndexMutationPayload {
  currentItemIndex: number;
  lastItemIndex?: number;
}

interface VolumeMutationPayload {
  volume: number;
}

interface IsMutedMutationPayload {
  isMuted: boolean;
}

export const mutations: MutationTree<PlaybackManagerState> = {
  SET_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = Object.freeze(queue);
  },
  ADD_TO_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = Object.freeze([...state.queue, ...queue]);
  },
  CLEAR_QUEUE(state: PlaybackManagerState) {
    state.queue = Object.freeze([]);
  },
  SET_CURRENT_ITEM_INDEX(
    state: PlaybackManagerState,
    { currentItemIndex, lastItemIndex }: CurrentItemIndexMutationPayload
  ) {
    if (!lastItemIndex) {
      state.lastItemIndex = state.currentItemIndex;
    } else {
      state.lastItemIndex = lastItemIndex;
    }

    state.currentItemIndex = currentItemIndex;
  },
  SET_CURRENT_MEDIA_SOURCE(
    state: PlaybackManagerState,
    { mediaSource }: { mediaSource: MediaSourceInfo }
  ) {
    state.currentMediaSource = mediaSource;
  },
  SET_CURRENT_VIDEO_TRACK_INDEX(
    state: PlaybackManagerState,
    { videoStreamIndex }: { videoStreamIndex: number }
  ) {
    state.currentVideoStreamIndex = videoStreamIndex;
  },
  SET_CURRENT_AUDIO_TRACK_INDEX(
    state: PlaybackManagerState,
    { audioStreamIndex }: { audioStreamIndex: number }
  ) {
    state.currentAudioStreamIndex = audioStreamIndex;
  },
  SET_CURRENT_SUBTITLE_TRACK_INDEX(
    state: PlaybackManagerState,
    { subtitleStreamIndex }: { subtitleStreamIndex: number }
  ) {
    state.currentSubtitleStreamIndex = subtitleStreamIndex;
  },
  INCREASE_QUEUE_INDEX(state: PlaybackManagerState) {
    if (state.currentItemIndex !== null) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex += 1;
      state.currentTime = 0;
    }
  },
  DECREASE_QUEUE_INDEX(state: PlaybackManagerState) {
    if (state.currentItemIndex !== null) {
      state.lastItemIndex = state.currentItemIndex;
      state.currentItemIndex -= 1;
      state.currentTime = 0;
    }
  },
  START_PLAYBACK(
    state: PlaybackManagerState,
    { initMode, initiator }: { initMode: InitMode; initiator: BaseItemDto }
  ) {
    state.status = PlaybackStatus.Playing;
    state.playbackInitMode = initMode;
    state.playbackInitiator = initiator;
  },
  UNPAUSE_PLAYBACK(state: PlaybackManagerState) {
    state.status = PlaybackStatus.Playing;
  },
  PAUSE_PLAYBACK(state: PlaybackManagerState) {
    state.status = PlaybackStatus.Paused;
  },
  STOP_PLAYBACK(state: PlaybackManagerState) {
    const volume = state.currentVolume;

    Object.assign(state, defaultState());
    state.currentVolume = volume;
  },
  RESET_LAST_ITEM_INDEX(state: PlaybackManagerState) {
    state.lastItemIndex = null;
  },
  SET_LAST_ITEM_INDEX(state: PlaybackManagerState) {
    state.lastItemIndex = state.currentItemIndex;
  },
  SET_LAST_PROGRESS_UPDATE(state: PlaybackManagerState, { progress }) {
    state.lastProgressUpdate = progress;
  },
  SET_VOLUME(state: PlaybackManagerState, { volume }: VolumeMutationPayload) {
    state.currentVolume = volume;
  },
  SET_IS_MUTED(
    state: PlaybackManagerState,
    { isMuted }: IsMutedMutationPayload
  ) {
    state.isMuted = isMuted;
  },
  SET_MINIMIZE(
    state: PlaybackManagerState,
    { minimized }: { minimized: boolean }
  ) {
    state.isMinimized = minimized;
  },
  SET_CURRENT_TIME(
    state: PlaybackManagerState,
    { time }: { time: number | null }
  ) {
    state.currentTime = time;
  },
  CHANGE_CURRENT_TIME(
    state: PlaybackManagerState,
    { time }: { time: number | null }
  ) {
    state.currentTime = time;
  },
  TOGGLE_MINIMIZE(state: PlaybackManagerState) {
    state.isMinimized = !state.isMinimized;
  },
  SET_PLAY_SESSION_ID(
    state: PlaybackManagerState,
    { id }: { id: string | null }
  ) {
    state.playSessionId = id;
  },
  SET_REPEAT_MODE(state: PlaybackManagerState, { mode }: { mode: RepeatMode }) {
    state.repeatMode = mode;
  },
  TOGGLE_SHUFFLE(state: PlaybackManagerState) {
    if (state.queue && state.currentItemIndex !== null) {
      if (!state.isShuffling) {
        const queue = shuffle(state.queue);

        state.originalQueue = Object.freeze(state.queue);

        const item = state.queue[state.currentItemIndex];
        const itemIndex = queue.indexOf(item);

        queue.splice(itemIndex, 1);
        queue.unshift(item);

        state.queue = Object.freeze(queue);
        state.currentItemIndex = 0;
        state.lastItemIndex = null;
        state.isShuffling = true;
      } else {
        const item = state.queue[state.currentItemIndex];

        state.currentItemIndex = state.originalQueue.indexOf(item);
        state.queue = Object.freeze(Array.from(state.originalQueue));
        state.originalQueue = [];
        state.lastItemIndex = null;
        state.isShuffling = false;
      }
    }
  }
};

export const actions: ActionTree<PlaybackManagerState, RootState> = {
  async play(
    { commit, state },
    {
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
    }
  ) {
    if (state.status !== PlaybackStatus.Stopped) {
      commit('STOP_PLAYBACK');
    }

    let translatedItems;

    if (startShuffled) {
      translatedItems = await this.$playback.translateItemsForPlayback(
        item,
        true
      );
    } else {
      translatedItems = await this.$playback.translateItemsForPlayback(item);
    }

    commit('SET_QUEUE', { queue: translatedItems });

    if (videoTrackIndex !== undefined) {
      commit('SET_CURRENT_VIDEO_TRACK_INDEX', {
        videoStreamIndex: videoTrackIndex
      });
    }

    if (audioTrackIndex !== undefined) {
      commit('SET_CURRENT_AUDIO_TRACK_INDEX', {
        audioStreamIndex: audioTrackIndex
      });
    }

    if (subtitleTrackIndex !== undefined) {
      commit('SET_CURRENT_SUBTITLE_TRACK_INDEX', {
        subtitleStreamIndex: subtitleTrackIndex
      });
    }

    commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: startFromIndex });
    commit('SET_CURRENT_TIME', { time: startFromTime });

    let opts;

    if (!startShuffled && initiator) {
      opts = { initMode: InitMode.Item, initiator };
    } else if (startShuffled && !initiator) {
      opts = { initMode: InitMode.Shuffle };
    } else if (startShuffled && initiator) {
      opts = { initMode: InitMode.ShuffleItem, initiator };
    } else {
      opts = { initMode: InitMode.Unknown };
    }

    commit('START_PLAYBACK', opts);
  },
  async playNext({ commit, state }, { item }: { item: BaseItemDto }) {
    const queue = Array.from(state.queue);
    const translatedItem = await this.$playback.translateItemsForPlayback(item);

    if (state.currentItemIndex !== null) {
      queue.splice(state.currentItemIndex + 1, 0, ...translatedItem);
      commit('SET_QUEUE', { queue });
    }
  },
  async addToQueue({ commit, state }, { item }: { item: BaseItemDto }) {
    const queue = Array.from(state.queue);
    const translatedItem = await this.$playback.translateItemsForPlayback(item);

    queue.push(...translatedItem);
    commit('SET_QUEUE', { queue });
  },
  setNewQueue({ commit, state }, { queue }) {
    let item;
    let lastItem;

    if (state.currentItemIndex !== null) {
      item = state.queue[state.currentItemIndex];
    }

    if (state.lastItemIndex !== null) {
      lastItem = state.queue[state.lastItemIndex];
    }

    const newIndex = queue?.indexOf(item as BaseItemDto);
    const lastItemNewIndex = queue?.indexOf(lastItem as BaseItemDto);

    commit('SET_QUEUE', { queue });
    commit('SET_CURRENT_ITEM_INDEX', {
      currentItemIndex: newIndex,
      lastItemIndex: lastItemNewIndex
    });
  },
  stop({ commit }) {
    commit('STOP_PLAYBACK');
  },
  pause({ commit, state }) {
    if (state.status === PlaybackStatus.Playing) {
      commit('PAUSE_PLAYBACK');
    }
  },
  unpause({ commit, state }) {
    if (state.status === PlaybackStatus.Paused) {
      commit('UNPAUSE_PLAYBACK');
    }
  },
  playPause({ commit, state }) {
    if (state.status === PlaybackStatus.Playing) {
      commit('PAUSE_PLAYBACK');
    } else if (state.status === PlaybackStatus.Paused) {
      commit('UNPAUSE_PLAYBACK');
    }
  },
  toggleMute({ commit, state }) {
    if (state.currentVolume === 0 && state.isMuted) {
      // if the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
      commit('SET_VOLUME', { volume: 100 });
    }

    commit('SET_IS_MUTED', { isMuted: !state.isMuted });
  },
  clearQueue({ commit }) {
    commit('SET_QUEUE', { queue: [] });
  },
  setMediaSource({ commit }, { mediaSource }) {
    commit('SET_CURRENT_MEDIA_SOURCE', { mediaSource });
  },
  setNextTrack({ commit, state }) {
    if (
      state.currentItemIndex !== null &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      commit('INCREASE_QUEUE_INDEX');
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: 0 });
    } else {
      commit('STOP_PLAYBACK');
    }
  },
  setPreviousTrack({ commit, state }) {
    if (state.currentTime !== null && state.currentTime > 2) {
      commit('CHANGE_CURRENT_TIME', { time: 0 });
      commit('SET_CURRENT_TIME', { time: 0 });
    } else if (state.currentItemIndex !== null && state.currentItemIndex > 0) {
      commit('DECREASE_QUEUE_INDEX');
    } else {
      commit('CHANGE_CURRENT_TIME', { time: 0 });
      commit('SET_CURRENT_TIME', { time: 0 });
    }
  },
  resetCurrentTime({ commit }) {
    commit('CHANGE_CURRENT_TIME', { time: 0 });
  },
  resetCurrentItemIndex({ commit }) {
    commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: null });
  },
  setLastItemIndex({ commit }) {
    commit('SET_LAST_ITEM_INDEX');
  },
  resetLastItemIndex({ commit }) {
    commit('RESET_LAST_ITEM_INDEX');
  },
  setLastProgressUpdate({ commit }, { progress }: { progress: number }) {
    commit('SET_LAST_PROGRESS_UPDATE', { progress });
  },
  setVolume({ commit, state }, { volume }: { volume: number }) {
    commit('SET_VOLUME', { volume });

    if (volume === 0) {
      commit('SET_IS_MUTED', { isMuted: true });
    } else if (state.isMuted === true) {
      commit('SET_IS_MUTED', { isMuted: false });
    }
  },
  setCurrentIndex({ commit, state }, { index }: { index: number }) {
    if (state.currentItemIndex !== index) {
      commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: index });
    }
  },
  setCurrentTime({ commit }, { time }: { time: number | null }) {
    commit('SET_CURRENT_TIME', { time });
  },
  changeCurrentTime({ commit }, { time }: { time: number | null }) {
    commit('CHANGE_CURRENT_TIME', { time });
  },
  skipForward({ commit, state }) {
    commit('CHANGE_CURRENT_TIME', { time: (state.currentTime || 0) + 15 });
  },
  skipBackward({ commit, state }) {
    // TODO: Store time to skip in a store to make it customizable
    if ((state.currentTime || 0) > 15) {
      commit('CHANGE_CURRENT_TIME', { time: (state.currentTime || 0) - 15 });
    } else {
      commit('CHANGE_CURRENT_TIME', { time: 0 });
    }
  },
  setMinimized({ commit }, { minimized }: { minimized: boolean }) {
    commit('SET_MINIMIZE', { minimized });
  },
  toggleMinimized({ commit }) {
    commit('TOGGLE_MINIMIZE');
  },
  setPlaySessionId({ commit }, { id }: { id: string | null }) {
    commit('SET_PLAY_SESSION_ID', { id });
  },
  // This function forces specific repeat modes, should only be used in very specific cases.
  // Use toggleRepeatMode for handling all the situations gracefully
  setRepeatMode({ commit }, { mode }: { mode: RepeatMode }) {
    commit('SET_REPEAT_MODE', { mode });
  },
  toggleShuffle({ commit }) {
    commit('TOGGLE_SHUFFLE');
  },
  toggleRepeatMode({ commit, state }) {
    // If there's only one item in queue, we only switch between RepeatOne and RepeatNone
    if (state.repeatMode === RepeatMode.RepeatNone) {
      if (state.queue.length > 1) {
        commit('SET_REPEAT_MODE', { mode: RepeatMode.RepeatAll });
      } else {
        commit('SET_REPEAT_MODE', { mode: RepeatMode.RepeatOne });
      }
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      if (state.queue.length > 1) {
        commit('SET_REPEAT_MODE', { mode: RepeatMode.RepeatOne });
      } else {
        commit('SET_REPEAT_MODE', { mode: RepeatMode.RepeatNone });
      }
    } else {
      commit('SET_REPEAT_MODE', { mode: RepeatMode.RepeatNone });
    }
  }
};
