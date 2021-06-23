import { ActionTree, MutationTree } from 'vuex';
import { RootState } from '..';

export interface PageState {
  title: string;
  opaqueAppBar: boolean;
  navDrawer: boolean;
}

export const defaultState = (): PageState => ({
  title: 'Jellyfin',
  opaqueAppBar: true,
  navDrawer: true
});

export const state = defaultState;

interface TitleMutationPayload {
  title: string;
}

interface AppBarMutationPayload {
  opaqueAppBar: boolean;
}

interface NavDrawerMutationPayload {
  showNavDrawer: boolean;
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
  },
  SET_NAVDRAWER_VISIBILITY(
    state: PageState,
    { showNavDrawer }: NavDrawerMutationPayload
  ) {
    state.navDrawer = showNavDrawer;
  },
  CLEAR_PAGE(state: PageState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<PageState, RootState> = {
  setPageTitle({ commit }, { title }: TitleMutationPayload) {
    commit('SET_PAGE_TITLE', { title });
  },
  setAppBarOpacity({ commit }, { opaqueAppBar }: AppBarMutationPayload) {
    commit('SET_APPBAR_OPACITY', { opaqueAppBar });
  },
  showNavDrawer({ commit }, { showNavDrawer }: NavDrawerMutationPayload) {
    commit('SET_NAVDRAWER_VISIBILITY', { showNavDrawer });
  },
  clearPage({ commit }) {
    commit('CLEAR_PAGE');
  }
};

export default {
  state,
  mutations,
  actions
};
