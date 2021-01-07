import { ActionTree, GetterTree, MutationTree } from 'vuex';
import { clamp, union } from 'lodash';
import {
  BaseItemDto,
  ChapterInfo,
  MediaSourceInfo
} from '@jellyfin/client-axios';
import { translateItemForPlayback } from '~/utils/playbackUtils';

export enum PlaybackStatus {
  stopped,
  playing,
  paused,
  error
}

export enum RepeatMode {
  none,
  single,
  all
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
  repeatMode: RepeatMode | null;
  queue: BaseItemDto[];
  playSessionId: string | null;
}

const defaultState = (): PlaybackManagerState => ({
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
  isMinimized: true,
  repeatMode: null,
  queue: [],
  playSessionId: null
});

export const state = defaultState;

export const getters: GetterTree<PlaybackManagerState, PlaybackManagerState> = {
  getCurrentItem: (state) => {
    if (
      state.currentItemIndex !== null &&
      state.queue[state.currentItemIndex]
    ) {
      return state.queue[state.currentItemIndex];
    } else {
      return null;
    }
  },
  getPreviousItem: (state) => {
    if (state.lastItemIndex !== null && state.queue[state.lastItemIndex]) {
      return state.queue[state.lastItemIndex];
    } else {
      return null;
    }
  },
  getCurrentlyPlayingType: (state) => {
    if (state.currentItemIndex !== null) {
      return state.queue?.[state.currentItemIndex].Type;
    } else {
      return null;
    }
  },
  getCurrentlyPlayingMediaType: (state) => {
    if (state.currentItemIndex !== null) {
      return state.queue?.[state.currentItemIndex].MediaType;
    } else {
      return null;
    }
  }
};

interface QueueMutationPayload {
  queue: BaseItemDto[];
}

interface CurrentItemIndexMutationPayload {
  currentItemIndex: number;
}

interface VolumeMutationPayload {
  volume: number;
}

export const mutations: MutationTree<PlaybackManagerState> = {
  SET_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = queue;
  },
  ADD_TO_QUEUE(state: PlaybackManagerState, { queue }: QueueMutationPayload) {
    state.queue = union(state.queue, queue);
  },
  CLEAR_QUEUE(state: PlaybackManagerState) {
    state.queue = [];
  },
  SET_CURRENT_ITEM_INDEX(
    state: PlaybackManagerState,
    { currentItemIndex }: CurrentItemIndexMutationPayload
  ) {
    state.lastItemIndex = state.currentItemIndex;
    state.currentItemIndex = currentItemIndex;
    // Sometimes, the PlaybackStatus was being reported as stopped on track change.
    // We set it as playing again here
    state.status = PlaybackStatus.playing;
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
      // Sometimes, the PlaybackStatus was being reported as stopped on track change.
      // We set it as playing again here
      state.status = PlaybackStatus.playing;
    }
  },
  DECREASE_QUEUE_INDEX(state: PlaybackManagerState) {
    if (state.currentItemIndex !== null) {
      state.currentItemIndex -= 1;
    }
  },
  START_PLAYBACK(state: PlaybackManagerState) {
    state.status = PlaybackStatus.playing;
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
  RESET_CURRENT_TIME(state: PlaybackManagerState) {
    state.currentTime = 0;
  },
  TOGGLE_MINIMIZE(state: PlaybackManagerState) {
    state.isMinimized = !state.isMinimized;
  },
  SET_PLAY_SESSION_ID(
    state: PlaybackManagerState,
    { id }: { id: string | null }
  ) {
    state.playSessionId = id;
  }
};

export const actions: ActionTree<PlaybackManagerState, PlaybackManagerState> = {
  async play(
    { commit, state },
    { items, startFromIndex }: { items: BaseItemDto[]; startFromIndex?: number }
  ) {
    if (state.status === PlaybackStatus.stopped) {
      commit('STOP_PLAYBACK');
    }
    const translatedItems = await translateItemForPlayback(items);

    commit('SET_QUEUE', { queue: translatedItems });
    commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: startFromIndex || 0 });
    commit('START_PLAYBACK');
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
    } else {
      commit('STOP_PLAYBACK');
    }
  },
  setPreviousTrack({ commit, state }) {
    if (state.currentTime !== null && state.currentTime > 2) {
      commit('RESET_CURRENT_TIME');
    } else if (state.currentItemIndex !== null && state.currentItemIndex > 0) {
      commit('DECREASE_QUEUE_INDEX');
    } else {
      commit('RESET_CURRENT_TIME');
    }
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
  setCurrentTime({ commit }, { time }: { time: number | null }) {
    commit('SET_CURRENT_TIME', { time });
  },
  changeCurrentTime({ commit }, { time }: { time: number | null }) {
    commit('CHANGE_CURRENT_TIME', { time });
  },
  setMinimized({ commit }, { minimized }: { minimized: boolean }) {
    commit('SET_MINIMIZE', { minimized });
  },
  toggleMinimized({ commit }) {
    commit('TOGGLE_MINIMIZE');
  },
  setPlaySessionId({ commit }, { id }) {
    commit('SET_PLAY_SESSION_ID', { id });
  }
};
