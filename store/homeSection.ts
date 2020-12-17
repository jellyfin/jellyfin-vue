import { ActionTree, GetterTree, MutationTree } from 'vuex';
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  ImageType,
  ItemFields
} from '@jellyfin/client-axios';
import Vue from 'vue';
import { AppState } from './index';

export interface HomeSection {
  name: string;
  libraryId: string;
  shape: string;
  type: string;
}

interface LatestMedia {
  [key: string]: BaseItemDto[];
}

export interface HomeSectionState {
  libraries: BaseItemDto[];
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: LatestMedia;
}

export const state = (): HomeSectionState => ({
  libraries: [],
  audioResumes: [],
  videoResumes: [],
  upNext: [],
  latestMedia: {}
});

type MutationPayload = {
  libraries: BaseItemDto[];
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: BaseItemDto[];
  libraryId?: string;
};

export const getters: GetterTree<HomeSectionState, AppState> = {
  getHomeSectionContent: (state) => (section: HomeSection) => {
    switch (section.type) {
      case 'libraries':
        return state.libraries;
      case 'resume':
        return state.videoResumes;
      case 'resumeaudio':
        return state.audioResumes;
      case 'upNext':
        return state.upNext;
      case 'latestmedia':
        return state.latestMedia[section.libraryId];
      default:
        return [];
    }
  }
};

export const mutations: MutationTree<HomeSectionState> = {
  ADD_LIBRARIES(state: HomeSectionState, { libraries }: MutationPayload) {
    state.libraries = libraries;
  },
  ADD_AUDIO_RESUMES(
    state: HomeSectionState,
    { audioResumes }: MutationPayload
  ) {
    state.audioResumes = audioResumes;
  },
  ADD_VIDEO_RESUMES(
    state: HomeSectionState,
    { videoResumes }: MutationPayload
  ) {
    state.videoResumes = videoResumes;
  },
  ADD_UP_NEXT(state: HomeSectionState, { upNext }: MutationPayload) {
    state.upNext = upNext;
  },
  ADD_LATEST_MEDIA(
    state: HomeSectionState,
    { latestMedia, libraryId }: MutationPayload
  ) {
    if (!libraryId) {
      throw new Error('libraryId is undefined');
    }
    Vue.set(state.latestMedia, libraryId, latestMedia);
  },
  CLEAR_HOME_SECTION_STATE(state: HomeSectionState) {
    state.libraries = [];
  }
};
export const actions: ActionTree<HomeSectionState, AppState> = {
  async getLibraries({ rootState, dispatch, commit }) {
    await dispatch('userViews/refreshUserViews', null, { root: true });

    commit('ADD_LIBRARIES', { libraries: rootState.userViews.views });
  },
  async getAudioResumes({ dispatch }) {
    try {
      const { data } = await this.$api.items.getResumeItems({
        userId: this.$auth.user.Id,
        limit: 12,
        fields: [ItemFields.PrimaryImageAspectRatio],
        imageTypeLimit: 1,
        enableImageTypes: [
          ImageType.Primary,
          ImageType.Backdrop,
          ImageType.Thumb
        ],
        enableTotalRecordCount: false,
        mediaTypes: ['Audio']
      });

      dispatch('getAudioResumesSuccess', data);
    } catch (err) {
      dispatch('getAudioResumesFailure', err);
    }
  },
  getAudioResumesSuccess({ commit }, response: BaseItemDtoQueryResult) {
    commit('ADD_AUDIO_RESUMES', {
      audioResumes: response.Items
    });
  },
  getAudioResumesFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  async getVideoResumes({ dispatch }) {
    try {
      const { data } = await this.$api.items.getResumeItems({
        userId: this.$auth.user.Id,
        limit: 12,
        fields: [ItemFields.PrimaryImageAspectRatio],
        imageTypeLimit: 1,
        enableImageTypes: [
          ImageType.Primary,
          ImageType.Backdrop,
          ImageType.Thumb
        ],
        enableTotalRecordCount: false,
        mediaTypes: ['Video']
      });

      dispatch('getVideoResumesSuccess', data);
    } catch (err) {
      dispatch('getVideoResumesFailure', err);
    }
  },
  getVideoResumesSuccess({ commit }, response: BaseItemDtoQueryResult) {
    commit('ADD_VIDEO_RESUMES', {
      videoResumes: response.Items
    });
  },
  getVideoResumesFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  async getUpNext({ dispatch }, { parentId }: { parentId: string }) {
    try {
      const { data } = await this.$api.tvShows.getNextUp({
        userId: this.$auth.user.Id,
        limit: 12,
        fields: [ItemFields.PrimaryImageAspectRatio],
        imageTypeLimit: 1,
        enableImageTypes: [
          ImageType.Primary,
          ImageType.Backdrop,
          ImageType.Thumb
        ],
        parentId
      });

      dispatch('getUpNextSuccess', data);
    } catch (err) {
      dispatch('getUpNextFailure', err);
    }
  },
  getUpNextSuccess({ commit }, response: BaseItemDtoQueryResult) {
    commit('ADD_UP_NEXT', {
      upNext: response.Items
    });
  },
  getUpNextFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  async getLatestMedia({ dispatch }, { parentId }: { parentId: string }) {
    try {
      const { data } = await this.$api.userLibrary.getLatestMedia({
        userId: this.$auth.user.Id,
        limit: 12,
        fields: [ItemFields.PrimaryImageAspectRatio],
        imageTypeLimit: 1,
        enableImageTypes: [
          ImageType.Primary,
          ImageType.Backdrop,
          ImageType.Thumb
        ],
        parentId
      });

      dispatch('getLatestMediaSuccess', {
        response: data,
        libraryId: parentId
      });
    } catch (err) {
      dispatch('getLatestMediaFailure', err);
    }
  },
  getLatestMediaSuccess({ commit }, { response, libraryId }) {
    commit('ADD_LATEST_MEDIA', {
      latestMedia: response,
      libraryId
    });
  },
  getLatestMediaFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  }
};
