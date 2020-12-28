import { ActionTree, MutationTree } from 'vuex';

export interface SnackbarState {
  message: string;
  color: string;
}

export const state = (): SnackbarState => ({
  message: '',
  color: ''
});

interface MutationPayload {
  message: string;
  color: string | undefined | null;
}

export const mutations: MutationTree<SnackbarState> = {
  SET_SNACKBAR_MESSAGE(
    state: SnackbarState,
    { message, color }: MutationPayload
  ) {
    state.message = message;
    state.color = color || '';
  },
  RESET_MESSAGE(state: SnackbarState) {
    state.message = '';
    state.color = '';
  }
};

export const actions: ActionTree<SnackbarState, SnackbarState> = {
  pushSnackbarMessage({ commit }, { message, color }: MutationPayload) {
    commit('SET_SNACKBAR_MESSAGE', { message, color });
  },
  resetMessage({ commit }) {
    commit('RESET_MESSAGE');
  }
};
