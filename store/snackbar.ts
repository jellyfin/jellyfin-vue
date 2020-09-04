import { MutationTree } from 'vuex';

export const state = () => ({
  message: '',
  color: ''
});

export type SnackbarState = ReturnType<typeof state>;

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
