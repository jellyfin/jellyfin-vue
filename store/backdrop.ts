import { ActionTree, GetterTree, MutationTree } from 'vuex';

export interface BackdropState {
  blurhash: string;
  opacity: number;
}

export const state = (): BackdropState => ({
  blurhash: '',
  opacity: 0.75
});

interface BackdropMutationPayload {
  newBlurhash: string;
}

interface BackdropOpacityMutationPayload {
  value: number;
}

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
    { value }: BackdropOpacityMutationPayload
  ) {
    state.opacity = value;
  },
  CLEAR_CURRENT_BACKDROP(state: BackdropState) {
    state.blurhash = '';
  },
  RESET_BACKDROP_OPACITY(state: BackdropState) {
    state.opacity = 0.75;
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
  setBackdropOpacity({ commit }, { value }: { value: number }) {
    commit('SET_BACKDROP_OPACITY', { value });
  },
  resetBackdropOpacity({ commit }) {
    commit('RESET_BACKDROP_OPACITY');
  }
};
