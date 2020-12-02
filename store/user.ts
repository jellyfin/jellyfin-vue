import { ActionTree, MutationTree } from 'vuex';

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
  SET_SERVER_URL(state: UserState, serverUrl) {
    state.serverUrl = serverUrl;
  },
  SET_USER(
    state: UserState,
    { id, serverUrl, accessToken, displayPreferences }: MutationPayload
  ) {
    state.id = id;
    state.serverUrl = serverUrl;
    state.accessToken = accessToken;
    state.displayPreferences = displayPreferences;
  },
  CLEAR_USER(state: UserState) {
    state.serverUrl = '';
    state.accessToken = '';
    state.displayPreferences = {};
  }
};

export const actions: ActionTree<UserState, UserState> = {
  setServerUrl({ commit }, serverUrl) {
    commit('SET_SERVER_URL', serverUrl);
  },
  async setUser(
    { commit },
    {
      id,
      serverUrl,
      accessToken
    }: { id: string; serverUrl: string; accessToken: string }
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- $api exists on here, the issue seems random. Not sure how to fix
    const response = await this.$api.displayPreferences.getDisplayPreferences({
      displayPreferencesId: 'usersettings',
      userId: id,
      client: 'vue'
    });

    commit('SET_USER', {
      id,
      serverUrl,
      accessToken,
      displayPreferences: response.data.CustomPrefs
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
      serverUrl: this.$axios.defaults.baseURL,
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
