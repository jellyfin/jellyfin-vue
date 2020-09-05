import { MutationTree } from 'vuex';

export interface UserState {
  id: string;
  serverUrl: string;
  accessToken: string;
}

export const state = (): UserState => ({
  id: '',
  serverUrl: '',
  accessToken: ''
});

interface MutationPayload {
  id: string;
  serverUrl: string;
  accessToken: string;
}

export const mutations: MutationTree<UserState> = {
  set(state: UserState, payload: MutationPayload) {
    state.id = payload.id;
    state.serverUrl = payload.serverUrl;
    state.accessToken = payload.accessToken;
  },
  clear(state: UserState) {
    state.serverUrl = '';
    state.serverUrl = '';
    state.accessToken = '';
  }
};
