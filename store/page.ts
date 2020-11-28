import { ActionTree, MutationTree } from 'vuex';

export interface PageState {
  title: string;
  opaqueAppBar: boolean;
}

export const state = (): PageState => ({
  title: 'Jellyfin',
  opaqueAppBar: false
});

interface TitleMutationPayload {
  title: string;
}

interface AppBarMutationPayload {
  opaqueAppBar: boolean;
}

export const mutations: MutationTree<PageState> = {
  SET_PAGE_TITLE(state: PageState, { title }: TitleMutationPayload) {
    state.title = title;
  },
  SET_APPBAR_OPACITY(
    state: PageState,
    { opaqueAppBar }: AppBarMutationPayload
  ) {
    state.opaqueAppBar = opaqueAppBar;
  }
};

export const actions: ActionTree<PageState, PageState> = {
  setPageTitle({ commit }, { title }: TitleMutationPayload) {
    commit('SET_PAGE_TITLE', { title });
  },
  setAppBarOpacity({ commit }, { opaqueAppBar }: AppBarMutationPayload) {
    commit('SET_APPBAR_OPACITY', { opaqueAppBar });
  }
};
