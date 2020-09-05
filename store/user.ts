import { MutationTree } from 'vuex';

export interface UserState {
  id: string;
  serverUrl: string;
  accessToken: string;
  displayPreferences: { [key: string]: string };
}

export const state = (): UserState => ({
  id: '',
  serverUrl: '',
  accessToken: '',
  displayPreferences: {}
});

interface MutationPayload {
  id: string;
  serverUrl: string;
  accessToken: string;
  displayPreferences: { [key: string]: string };
}

export const mutations: MutationTree<UserState> = {
  set(state: UserState, payload: MutationPayload) {
    state.id = payload.id;
    state.serverUrl = payload.serverUrl;
    state.accessToken = payload.accessToken;
    state.displayPreferences = payload.displayPreferences;
  },
  clear(state: UserState) {
    state.serverUrl = '';
    state.serverUrl = '';
    state.accessToken = '';
    state.displayPreferences = {};
  }
};
