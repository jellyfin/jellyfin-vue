import { MutationTree } from 'vuex';

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
  display(state: SnackbarState, payload: MutationPayload) {
    state.message = payload.message;
    state.color = payload.color ? <string>payload.color : '';
  }
};
