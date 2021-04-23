import Vue from 'vue';
import { MutationTree, ActionTree } from 'vuex';
import { UserDto } from '@jellyfin/client-axios/models/user-dto';
// Modules
import { TvShowsState } from './tvShows';
import { ServerState } from './servers';
import { PageState } from './page';
import { SnackbarState } from './snackbar';
import { UserState } from './user';
import { UserViewsState } from './userViews';
import { HomeSectionState } from './homeSection';
import { PlaybackManagerState } from './playbackManager';
import { BackdropState } from './backdrop';
import { DeviceState } from './deviceProfile';
import { ClientSettingsState } from './clientSettings';
import { ItemsState } from './items';
// Vuex plugins
import { websocketPlugin } from './plugins/websocketPlugin';
import { playbackReportingPlugin } from './plugins/playbackReportingPlugin';
import { preferencesSync } from './plugins/preferencesSyncPlugin';
import { userPlugin } from './plugins/userPlugin';

export const plugins = [
  websocketPlugin,
  playbackReportingPlugin,
  preferencesSync,
  userPlugin
];

export interface AuthState {
  busy: boolean;
  loggedIn: boolean;
  rememberMe: boolean;
  strategy: string;
  user: UserDto;
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
export interface AppState extends RootState {
  auth: AuthState;
  backdrop: BackdropState;
  clientSettings: ClientSettingsState;
  deviceProfile: DeviceState;
  homeSection: HomeSectionState;
  items: ItemsState;
  page: PageState;
  playbackManager: PlaybackManagerState;
  servers: ServerState;
  snackBar: SnackbarState;
  tvShows: TvShowsState;
  user: UserState;
  userViews: UserViewsState;
}

export const state = (): RootState => ({
  syncing: false,
  socket: {
    instance: null,
    isConnected: false,
    message: {},
    reconnectError: false
  }
});

export const mutations: MutationTree<RootState> = {
  SOCKET_ONOPEN(state: RootState, event: Event) {
    const socketInstance = event.currentTarget;

    Vue.set(state.socket, 'instance', socketInstance);
    Vue.set(state.socket, 'isConnected', true);
    Vue.set(state.socket, 'reconnectError', false);
  },
  SOCKET_ONCLOSE(state: RootState, _event: CloseEvent) {
    Vue.set(state.socket, 'isConnected', false);
  },
  SOCKET_ONERROR(state: RootState, event: Event) {
    // eslint-disable-next-line no-console
    console.error(state, event);
  },
  SOCKET_ONMESSAGE(state: RootState, message) {
    Vue.set(state.socket, 'message', message);
  },
  SOCKET_RECONNECT(state: RootState, count: number) {
    // eslint-disable-next-line no-console
    console.info(state, count);
  },
  SOCKET_RECONNECT_ERROR(state: RootState) {
    Vue.set(state.socket, 'reconnectError', true);
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
