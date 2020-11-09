import { ActionTree, GetterTree, MutationTree } from 'vuex';

export interface BackdropState {
  blurhash: string;
}

export const state = (): BackdropState => ({
  blurhash: ''
});

export const getters: GetterTree<BackdropState, BackdropState> = {
  getBackdropBlurhash: (state: BackdropState) => state.blurhash
};

export const mutations: MutationTree<BackdropState> = {
  SET_CURRENT_BACKDROP(state: BackdropState, newBlurhash: string) {
    state.blurhash = newBlurhash;
  },
  CLEAR_CURRENT_BACKDROP(state: BackdropState) {
    state.blurhash = '';
  }
};

export const actions: ActionTree<BackdropState, BackdropState> = {
  setBackdrop({ commit }, { item }) {
    let hash: string;

    if (item.ImageBlurHashes.Backdrop && item.BackdropImageTags.length > 0) {
      hash = item.ImageBlurHashes?.Backdrop[item.BackdropImageTags[0]];
      console.error(hash);
    } else if (
      item.ImageBlurHashes.Backdrop &&
      item.ParentBackdropImageTags.length > 0
    ) {
      hash = item.ImageBlurHashes?.Backdrop[item.ParentBackdropImageTags[0]];
      console.error(hash);
    } else {
      hash = '';
    }

    commit('SET_CURRENT_BACKDROP', hash);
  },
  clearBackdrop({ commit }) {
    commit('CLEAR_CURRENT_BACKDROP');
  }
};
