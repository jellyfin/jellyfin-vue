import { ActionTree, MutationTree } from 'vuex';

export interface UserState {
  id: string;
  accessToken: string;
}

export const state = (): UserState => ({
  id: '',
  accessToken: ''
});

interface MutationPayload {
  id: string;
  accessToken: string;
}

export const mutations: MutationTree<UserState> = {
  SET_USER(state: UserState, { id, accessToken }: MutationPayload) {
    state.id = id;
    state.accessToken = accessToken;
  },
  CLEAR_USER(state: UserState) {
    state.accessToken = '';
  }
};

export const actions: ActionTree<UserState, UserState> = {
  setUser(
    { commit },
    { id, accessToken }: { id: string; accessToken: string }
  ) {
    commit('SET_USER', {
      id,
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
      id: response.User.Id,
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
