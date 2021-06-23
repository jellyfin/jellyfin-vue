import { ActionTree, GetterTree, MutationTree } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import { getLibraryIcon } from '~/utils/items';

export interface UserViewsState {
  views: BaseItemDto[];
}

export const defaultState = (): UserViewsState => ({
  views: []
});

export const state = defaultState;

interface MutationPayload {
  userViews: BaseItemDto[];
}

export const getters: GetterTree<UserViewsState, UserViewsState> = {
  getNavigationDrawerItems: (state) => {
    return state.views.map((view: BaseItemDto) => {
      return {
        icon: getLibraryIcon(view.CollectionType),
        title: view.Name,
        to: `/library/${view.Id}`
      };
    });
  },
  getUserViews: (state): BaseItemDto[] => {
    return state.views;
  }
};

export const mutations: MutationTree<UserViewsState> = {
  SET_USER_VIEWS(state: UserViewsState, { userViews }: MutationPayload) {
    state.views = userViews;
  },
  CLEAR_USER_VIEWS(state: UserViewsState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<UserViewsState, UserViewsState> = {
  async refreshUserViews({ commit }) {
    try {
      const userViewsResponse = await this.$api.userViews.getUserViews({
        userId: this.$auth.user?.Id
      });

      const userViews = userViewsResponse.data.Items;

      commit('SET_USER_VIEWS', { userViews });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  },
  clearUserViews({ commit }) {
    commit('CLEAR_USER_VIEWS');
  }
};
