import { ActionTree, MutationTree } from 'vuex';

export interface PageState {
  title: string;
}

export const state = (): PageState => ({
  title: 'Jellyfin'
});

interface MutationPayload {
  title: string;
}

export const mutations: MutationTree<PageState> = {
  SET_PAGE_TITLE(state: PageState, { title }: MutationPayload) {
    state.title = title;
  }
};

export const actions: ActionTree<PageState, PageState> = {
  setPageTitle({ commit }, { title }: MutationPayload) {
    commit('SET_PAGE_TITLE', { title });
  }
};
