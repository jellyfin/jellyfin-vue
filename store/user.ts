import { ActionTree, MutationTree } from 'vuex';

export interface UserState {
  accessToken: string;
}

const defaultState = (): UserState => ({
  accessToken: ''
});

export const state = defaultState;

interface MutationPayload {
  accessToken: string;
}

export const mutations: MutationTree<UserState> = {
  SET_USER(state: UserState, { accessToken }: MutationPayload) {
    state.accessToken = accessToken;
  },
  CLEAR_USER(state: UserState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<UserState, UserState> = {
  setUser({ commit }, { accessToken }: { accessToken: string }) {
    commit('SET_USER', {
      accessToken
    });
  },
  clearUser({ commit }) {
    commit('CLEAR_USER');
  },
  async loginRequest({ dispatch }, credentials) {
    try {
      const { data } = await this.$auth.loginWith('jellyfin', credentials);

      dispatch('loginRequestSuccess', data);
    } catch (err) {
      dispatch('loginRequestFailure', err);
    }
  },
  loginRequestSuccess({ dispatch }, response) {
    dispatch('setUser', {
      accessToken: response.AccessToken
    });
  },
  loginRequestFailure({ dispatch }, error) {
    if (!this.$axios.defaults.baseURL) {
      dispatch('servers/notifyNoServerUsed', {
        root: true
      });
      return;
    }

    let errorMessage = 'unexpectedError';

    if (!error.response) {
      errorMessage = error.message || 'serverNotFound';
    } else if (error.response.status === 500 || error.response.status === 401) {
      errorMessage = 'incorrectUsernameOrPassword';
    } else if (error.response.status === 400) {
      errorMessage = 'badRequest';
    }

    dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: errorMessage,
        color: 'error'
      },
      {
        root: true
      }
    );
  }
};
