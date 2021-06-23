import { createStore, createLogger } from 'vuex';
import Vue from 'vue';
import { MutationTree, ActionTree } from 'vuex';
// Vuex plugins
import { websocketPlugin } from './plugins/websocketPlugin';
import { playbackReportingPlugin } from './plugins/playbackReportingPlugin';
import { preferencesSync } from './plugins/preferencesSyncPlugin';
import { userPlugin } from './plugins/userPlugin';

export const plugins = [
  //websocketPlugin,
  //playbackReportingPlugin,
  //preferencesSync,
  //userPlugin
];

if (process.env.NODE_ENV !== 'production') {
  plugins.push(createLogger());
}

export interface RootState {
  // A generic syncing indicator for settings or item syncing to and from the server
  syncing: boolean;
  // Handled by vue-native-websocket
  socket: {
    instance: WebSocket | null;
    isConnected: boolean;
    message: Record<string, never>;
    reconnectError: boolean;
  };
}

export const state: RootState = {
  syncing: false,
  socket: {
    instance: null,
    isConnected: false,
    message: {},
    reconnectError: false
  }
};

export const mutations: MutationTree<RootState> = {
  SOCKET_ONOPEN(state: RootState, event: Event) {
    const socketInstance = event.currentTarget;

    state.socket.instance = socketInstance as WebSocket;
    state.socket.isConnected = true;
    state.socket.reconnectError = false;
  },
  SOCKET_ONCLOSE(state: RootState, _event: CloseEvent) {
    state.socket.isConnected = false;
  },
  SOCKET_ONERROR(state: RootState, event: Event) {
    // eslint-disable-next-line no-console
    console.error(state, event);
  },
  SOCKET_ONMESSAGE(state: RootState, message) {
    state.socket.message = message;
  },
  SOCKET_RECONNECT(state: RootState, count: number) {
    // eslint-disable-next-line no-console
    console.info(state, count);
  },
  SOCKET_RECONNECT_ERROR(state: RootState) {
    state.socket.reconnectError = true;
  },
  SET_SYNC_STATUS(state: RootState, value: boolean) {
    state.syncing = value;
  }
};

export const actions: ActionTree<RootState, RootState> = {
  async reset({ dispatch }, { clearCritical }: { clearCritical: boolean }) {
    const promises = [];

    promises.push(dispatch('backdrop/clearAllBackdrop', { root: true }));
    promises.push(dispatch('clientSettings/resetState', { root: true }));
    promises.push(dispatch('homeSection/clearHomeSection', { root: true }));
    promises.push(dispatch('items/clearState', { root: true }));
    promises.push(dispatch('page/clearPage', { root: true }));
    promises.push(dispatch('playbackManager/stop', { root: true }));
    promises.push(dispatch('snackbar/resetMessage', { root: true }));
    promises.push(dispatch('tvShows/clearTvShows', { root: true }));
    promises.push(dispatch('user/clearUser', { root: true }));
    promises.push(dispatch('userViews/clearUserViews', { root: true }));

    if (clearCritical) {
      promises.push(dispatch('servers/clearServers', { root: true }));
    }

    await Promise.all(promises);
  },
  setSyncStatus({ commit }, value: boolean) {
    commit('SET_SYNC_STATUS', value);
  }
};

const store = createStore({
  state,
  mutations,
  actions,
  modules: {},
  strict: true,
  plugins: plugins
});

export default store;
