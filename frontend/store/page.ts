import { ActionTree, MutationTree } from 'vuex';

/**
 * Public interfaces
 */
export interface BackdropParameters {
  blurhash: string;
  opacity: number;
}
export interface PageState {
  title: string;
  opaqueAppBar: boolean;
  navDrawer: boolean;
  isScrolled: boolean;
  backdrop: BackdropParameters;
}

/**
 * State values
 */

export const defaultState = (): PageState => ({
  title: 'Jellyfin',
  opaqueAppBar: true,
  navDrawer: true,
  isScrolled: false,
  backdrop: {
    blurhash: '',
    opacity: 0.75
  }
});

export const state = defaultState;

/**
 * Vuex mutations
 */
export const mutations: MutationTree<PageState> = {
  SET_PAGE_TITLE(state: PageState, { title }: { title: string }) {
    state.title = title;
  },
  SET_APPBAR_OPACITY(
    state: PageState,
    { opaqueAppBar }: { opaqueAppBar: boolean }
  ) {
    state.opaqueAppBar = opaqueAppBar;
  },
  SET_NAVDRAWER_VISIBILITY(
    state: PageState,
    { showNavDrawer }: { showNavDrawer: boolean }
  ) {
    state.navDrawer = showNavDrawer;
  },
  SET_IS_SCROLLED(state: PageState, { scrolled }: { scrolled: boolean }) {
    state.isScrolled = scrolled;
  },
  SET_BACKDROP(state: PageState, { newBlurhash }: { newBlurhash: string }) {
    state.backdrop.blurhash = newBlurhash;
  },
  SET_BACKDROP_OPACITY(
    state: PageState,
    { newOpacity }: { newOpacity: number }
  ) {
    state.backdrop.opacity = newOpacity;
  },
  RESET_BACKDROP(state: PageState) {
    state.backdrop = defaultState().backdrop;
  },
  CLEAR_PAGE(state: PageState) {
    Object.assign(state, defaultState());
  }
};

/**
 * Vuex actions
 */
export const actions: ActionTree<PageState, PageState> = {
  setPageTitle({ commit }, { title }: { title: string }) {
    commit('SET_PAGE_TITLE', { title });
  },
  setAppBarOpacity(
    { commit, state },
    { opaqueAppBar }: { opaqueAppBar: boolean }
  ) {
    if (
      state.opaqueAppBar !== opaqueAppBar &&
      typeof opaqueAppBar === 'boolean'
    ) {
      commit('SET_APPBAR_OPACITY', { opaqueAppBar });
    }
  },
  setIsScrolled({ commit }, { scrolled }: { scrolled: boolean }) {
    commit('SET_IS_SCROLLED', { scrolled });
  },
  showNavDrawer({ commit }, { showNavDrawer }: { showNavDrawer: boolean }) {
    commit('SET_NAVDRAWER_VISIBILITY', { showNavDrawer });
  },
  setBackdrop({ commit }, { hash }: { hash: string }) {
    if (hash) {
      commit('SET_BACKDROP', { newBlurhash: hash });
    } else {
      commit('RESET_BACKDROP');
    }
  },
  setBackdropOpacity({ commit }, { newOpacity }: { newOpacity: number }) {
    commit('SET_BACKDROP_OPACITY', { newOpacity });
  },
  resetBackdropOpacity({ commit }) {
    commit('SET_BACKDROP_OPACITY', {
      newOpacity: defaultState().backdrop.opacity
    });
  },
  clearBackdrop({ commit }) {
    commit('RESET_BACKDROP');
  },
  clearPage({ commit }) {
    commit('CLEAR_PAGE');
  }
};
