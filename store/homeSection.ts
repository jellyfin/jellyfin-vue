import { ActionTree, MutationTree } from 'vuex';
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  ImageType,
  ItemFields
} from '@jellyfin/client-axios';
import { AppState } from './index';

export interface HomeSection {
  items: BaseItemDto[];
}

export const state = (): HomeSection => ({
  items: []
});

type MutationPayload = {
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: BaseItemDto[];
};

export const mutations: MutationTree<HomeSection> = {
  ADD_LIBRARIES(state: HomeSection, { items }: { items: BaseItemDto[] }) {
    state.items = items;
  },
  ADD_AUDIO_RESUMES(state: HomeSection, { audioResumes }: MutationPayload) {
    state.items = audioResumes;
  },
  ADD_VIDEO_RESUMES(state: HomeSection, { videoResumes }: MutationPayload) {
    state.items = videoResumes;
  },
  ADD_UP_NEXT(state: HomeSection, { upNext }: MutationPayload) {
    state.items = upNext;
  },
  ADD_LATEST_MEDIA(state: HomeSection, { latestMedia }: MutationPayload) {
    state.items = latestMedia;
  },
  CLEAR_HOME_SECTION_STATE(state: HomeSection) {
    state.items = [];
  }
};
export const actions: ActionTree<HomeSection, AppState> = {
  async getLibraries({ rootState, dispatch, commit }) {
    await dispatch('userViews/refreshUserViews', null, { root: true });

    commit('ADD_LIBRARIES', rootState.userViews.views);
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

      dispatch('getLatestMediaSuccess', data.Items);
    } catch (err) {
      dispatch('getLatestMediaFailure', err);
    }
  },
  getLatestMediaSuccess({ commit }, response: BaseItemDtoQueryResult) {
    commit('ADD_LATEST_MEDIA', {
      latestMedia: response
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
