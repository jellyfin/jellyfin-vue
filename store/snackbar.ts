import { ActionTree, MutationTree } from 'vuex';

export interface SnackbarState {
  message: string;
  color: string;
}

const defaultState = (): SnackbarState => ({
  message: '',
  color: ''
});

export const state = defaultState;

interface MutationPayload {
  message: string;
  color?: string;
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
    Object.assign(state, defaultState());
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
