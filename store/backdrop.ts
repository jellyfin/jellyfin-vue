import { ActionTree, GetterTree, MutationTree } from 'vuex';

export interface BackdropState {
  blurhash: string;
  opacity: number;
}

interface BackdropMutationPayload {
  newBlurhash: string;
}

interface BackdropOpacityMutationPayload {
  newOpacity: number;
}
const defaultState = (): BackdropState => ({
  blurhash: '',
  opacity: 0.75
});

export const state = defaultState;

export const getters: GetterTree<BackdropState, BackdropState> = {
  getBackdropBlurhash: (state: BackdropState) => state.blurhash
};

export const mutations: MutationTree<BackdropState> = {
  SET_CURRENT_BACKDROP(
    state: BackdropState,
    { newBlurhash }: BackdropMutationPayload
  ) {
    state.blurhash = newBlurhash;
  },
  SET_BACKDROP_OPACITY(
    state: BackdropState,
    { newOpacity }: BackdropOpacityMutationPayload
  ) {
    state.opacity = newOpacity;
  },
  CLEAR_CURRENT_BACKDROP(state: BackdropState) {
    state.blurhash = defaultState().blurhash;
  },
  RESET_BACKDROP_OPACITY(state: BackdropState) {
    state.opacity = defaultState().opacity;
  },
  CLEAR_ALL_BACKDROP(state: BackdropState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<BackdropState, BackdropState> = {
  setBackdrop({ commit }, { hash }: { hash: string }) {
    if (hash) {
      commit('SET_CURRENT_BACKDROP', { newBlurhash: hash });
    } else {
      commit('CLEAR_CURRENT_BACKDROP');
      commit('RESET_BACKDROP_OPACITY');
    }
  },
  clearBackdrop({ commit }) {
    commit('CLEAR_CURRENT_BACKDROP');
  },
  setBackdropOpacity({ commit }, { newOpacity }: { newOpacity: number }) {
    commit('SET_BACKDROP_OPACITY', { newOpacity });
  },
  clearAllBackdrop({ commit }) {
    commit('CLEAR_ALL_BACKDROP');
  },
  resetBackdropOpacity({ commit }) {
    commit('RESET_BACKDROP_OPACITY');
  }
};
