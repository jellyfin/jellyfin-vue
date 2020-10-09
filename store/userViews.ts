import { ActionTree, GetterTree, MutationTree } from 'vuex';
import { BaseItemDto } from '~/api';
import { getLibraryIcon } from '~/utils/items';

export interface UserViewsState {
  views: BaseItemDto[];
}

export const state = (): UserViewsState => ({
  views: []
});

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
  }
};

export const mutations: MutationTree<UserViewsState> = {
  SET_USER_VIEWS(state: UserViewsState, { userViews }: MutationPayload) {
    state.views = userViews;
  }
};

export const actions: ActionTree<UserViewsState, UserViewsState> = {
  async refresh({ commit }) {
    const userViewsResponse = await this.$api.userViews.getUserViews({
      userId: this.$auth.user.Id
    });

    const userViews = userViewsResponse.data.Items;

    commit('SET_USER_VIEWS', { userViews });
  }
};
