import { ActionTree, GetterTree, MutationTree } from 'vuex';
import clamp from 'lodash/clamp';
import shuffle from 'lodash/shuffle';
import {
  BaseItemDto,
  ChapterInfo,
  MediaSourceInfo
} from '@jellyfin/client-axios';
import { translateItemsForPlayback } from '~/utils/playbackUtils';

export enum PlaybackStatus {
  stopped,
  playing,
  paused,
  error
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

export interface PlaybackManagerState {
  status: PlaybackStatus;
  lastItemIndex: number | null;
  currentItemIndex: number | null;
  currentMediaSource: MediaSourceInfo | null;
  currentVideoStreamIndex: number | null;
  currentAudioStreamIndex: number | null;
  currentSubtitleStreamIndex: number | null;
  currentItemChapters: ChapterInfo[] | null;
  currentTime: number | null;
  lastProgressUpdate: number;
  currentVolume: number;
  isFullscreen: boolean;
  isMuted: boolean;
  isShuffling: boolean;
  isMinimized: boolean;
  repeatMode: RepeatMode;
  queue: BaseItemDto[];
  originalQueue: BaseItemDto[];
  playSessionId: string | null;
  playbackInitiator: BaseItemDto | null;
  playbackInitMode: InitMode;
}

export const defaultState = (): PlaybackManagerState => ({
  status: PlaybackStatus.stopped,
  lastItemIndex: null,
  currentItemIndex: null,
  currentMediaSource: null,
  currentVideoStreamIndex: 0,
  currentAudioStreamIndex: 0,
  currentSubtitleStreamIndex: 0,
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

export const getters: GetterTree<PlaybackManagerState, PlaybackManagerState> = {
  getCurrentItem: (state) => {
    if (
      state.currentItemIndex !== null &&
      state.queue[state.currentItemIndex]
    ) {
      return state.queue[state.currentItemIndex];
    }

    return null;
  },
  getPreviousItem: (state) => {
    if (state.currentItemIndex === 0) {
      return null;
    } else if (
      state.lastItemIndex !== null &&
      state.queue[state.lastItemIndex]
    ) {
      return state.queue[state.lastItemIndex];
    }

    return null;
  },
  getNextItem: (state) => {
    if (
      state.currentItemIndex !== null &&
      state.currentItemIndex + 1 < state.queue.length
    ) {
      return state.queue[state.currentItemIndex + 1];
    } else if (state.repeatMode === RepeatMode.RepeatAll) {
      return state.queue[0];
    }

    return null;
  },
  getCurrentlyPlayingType: (state) => {
    if (state.currentItemIndex !== null) {
      return state.queue?.[state.currentItemIndex]?.Type;
    }

    return null;
  },
  getCurrentlyPlayingMediaType: (state) => {
    if (state.currentItemIndex !== null) {
      return state.queue?.[state.currentItemIndex]?.MediaType;
    }

    return null;
  },
  getCurrentItemSubtitleTracks: (state) => {
    if (state.currentMediaSource !== null) {
      return state.currentMediaSource.MediaStreams?.filter((stream) => {
        return stream.Type === 'Subtitle';
      });
    }
  }
};

interface QueueMutationPayload {
  queue: BaseItemDto[];
}

interface CurrentItemIndexMutationPayload {
  currentItemIndex: number;
  lastItemIndex?: number;
}

interface VolumeMutationPayload {
  volume: number;
}

export const mutations: MutationTree<PlaybackManagerState> = {
  SET_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = queue;
  },
  ADD_TO_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = [...state.queue, ...queue];
  },
  CLEAR_QUEUE(state: PlaybackManagerState) {
    state.queue = [];
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
    state.status = PlaybackStatus.playing;
    state.playbackInitMode = initMode;
    state.playbackInitiator = initiator;
  },
  UNPAUSE_PLAYBACK(state: PlaybackManagerState) {
    state.status = PlaybackStatus.playing;
  },
  PAUSE_PLAYBACK(state: PlaybackManagerState) {
    state.status = PlaybackStatus.paused;
  },
  STOP_PLAYBACK(state: PlaybackManagerState) {
    Object.assign(state, defaultState());
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
    state.currentVolume = clamp(volume, 0, 100);
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
        state.originalQueue = Array.from(state.queue);

        const item = state.queue[state.currentItemIndex];
        const itemIndex = state.queue.indexOf(item);

        state.queue.splice(itemIndex, 1);
        state.queue = shuffle(state.queue);
        state.queue.unshift(item);
        state.currentItemIndex = 0;
        state.lastItemIndex = null;
        state.isShuffling = true;
      } else {
        const item = state.queue[state.currentItemIndex];

        state.currentItemIndex = state.originalQueue.indexOf(item);
        state.queue = Array.from(state.originalQueue);
        state.originalQueue = [];
        state.lastItemIndex = null;
        state.isShuffling = false;
      }
    }
  }
};

export const actions: ActionTree<PlaybackManagerState, PlaybackManagerState> = {
  async play(
    { commit, state },
    {
      items,
      startFromIndex = 0,
      startFromTime = 0,
      initiator,
      startShuffled = false
    }: {
      items: BaseItemDto[];
      startFromIndex?: number;
      startFromTime?: number;
      initiator?: BaseItemDto;
      startShuffled?: boolean;
    }
  ) {
    if (state.status !== PlaybackStatus.stopped) {
      commit('STOP_PLAYBACK');
    }

    let translatedItems;

    if (!startShuffled) {
      translatedItems = await translateItemsForPlayback(items);
    } else {
      translatedItems = shuffle(await translateItemsForPlayback(items));
    }

    commit('SET_QUEUE', { queue: translatedItems });
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
    const translatedItem = await translateItemsForPlayback([item]);

    if (state.currentItemIndex !== null) {
      queue.splice(state.currentItemIndex + 1, 0, ...translatedItem);
      commit('SET_QUEUE', { queue });
    }
  },
  async addToQueue({ commit, state }, { item }: { item: BaseItemDto }) {
    const queue = Array.from(state.queue);
    const translatedItem = await translateItemsForPlayback([item]);

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
  pause({ commit }) {
    commit('PAUSE_PLAYBACK');
  },
  unpause({ commit }) {
    commit('UNPAUSE_PLAYBACK');
  },
  playPause({ commit, state }) {
    if (state.status === PlaybackStatus.playing) {
      commit('PAUSE_PLAYBACK');
    } else if (state.status === PlaybackStatus.paused) {
      commit('UNPAUSE_PLAYBACK');
    }
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
  setVolume({ commit }, { volume }: { volume: number }) {
    commit('SET_VOLUME', { volume });
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
