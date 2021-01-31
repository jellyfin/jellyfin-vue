import Vue from 'vue';
import { ActionTree, MutationTree } from 'vuex';

export type MediaSourceId = string;

export interface MediaSourcePreferences {
  videoStreamIndex?: number;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
}

export interface MediaSourcePreferencesState {
  preferences: Record<MediaSourceId, MediaSourcePreferences>;
}

export const defaultState = (): MediaSourcePreferencesState => ({
  preferences: {}
});

export const state = defaultState;

export interface SetTrackMutationPayload {
  sourceId: MediaSourceId;
  streamIndex?: number;
}

export const mutations: MutationTree<MediaSourcePreferencesState> = {
  SET_VIDEO_STREAM(state, { sourceId, streamIndex }: SetTrackMutationPayload) {
    const sourcePrefs = state.preferences[sourceId] || {};

    // Make sure Vue tracks changes to this dynamic key
    Vue.set(state.preferences, sourceId, sourcePrefs);
    Vue.set(state.preferences[sourceId], 'videoStreamIndex', streamIndex);
  },
  SET_AUDIO_STREAM(state, { sourceId, streamIndex }: SetTrackMutationPayload) {
    const sourcePrefs = state.preferences[sourceId] || {};

    // Make sure Vue tracks changes to this dynamic key
    Vue.set(state.preferences, sourceId, sourcePrefs);
    Vue.set(state.preferences[sourceId], 'audioStreamIndex', streamIndex);
  },
  SET_SUBTITLE_STREAM(
    state,
    { sourceId, streamIndex }: SetTrackMutationPayload
  ) {
    const sourcePrefs = state.preferences[sourceId] || {};

    // Make sure Vue tracks changes to this dynamic key
    Vue.set(state.preferences, sourceId, sourcePrefs);
    Vue.set(state.preferences[sourceId], 'subtitleStreamIndex', streamIndex);
  }
};

export const actions: ActionTree<
  MediaSourcePreferencesState,
  MediaSourcePreferencesState
> = {
  setVideoStream({ commit }, payload: SetTrackMutationPayload) {
    commit('SET_VIDEO_STREAM', payload);
  },
  setAudioStream({ commit }, payload: SetTrackMutationPayload) {
    commit('SET_AUDIO_STREAM', payload);
  },
  setSubtitleStream({ commit }, payload: SetTrackMutationPayload) {
    commit('SET_SUBTITLE_STREAM', payload);
  }
};
