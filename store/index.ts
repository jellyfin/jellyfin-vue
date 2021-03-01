import Vue from 'vue';
import { MutationTree, ActionTree } from 'vuex';
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
import { DisplayPreferencesState } from './displayPreferences';
import { websocketPlugin } from './plugins/websocket';

export const plugins = [websocketPlugin];

export interface RootState {
  socket: {
    instance: WebSocket | null;
    isConnected: boolean;
    message: Record<string, never>;
    reconnectError: boolean;
  };
}
export interface AppState extends RootState {
  backdrop: BackdropState;
  device: DeviceState;
  displayPreferences: DisplayPreferencesState;
  homeSection: HomeSectionState;
  page: PageState;
  playbackManager: PlaybackManagerState;
  servers: ServerState;
  snackBar: SnackbarState;
  tvShows: TvShowsState;
  user: UserState;
  userViews: UserViewsState;
}

export const state = (): RootState => ({
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
  }
};

export const actions: ActionTree<RootState, RootState> = {
  async reset({ dispatch }, { clearCritical }: { clearCritical: boolean }) {
    const promises = [];
    promises.push(dispatch('backdrop/clearAllBackdrop', { root: true }));
    promises.push(dispatch('deviceProfile/clearDeviceProfile', { root: true }));
    promises.push(dispatch('displayPreferences/resetState', { root: true }));
    promises.push(dispatch('homeSection/clearHomeSection', { root: true }));
    promises.push(dispatch('page/clearPage', { root: true }));
    promises.push(dispatch('playbackManager/stop', { root: true }));
    if (clearCritical) {
      promises.push(dispatch('servers/clearServers', { root: true }));
    }
    promises.push(dispatch('snackbar/resetMessage', { root: true }));
    promises.push(dispatch('tvShows/clearTvShows', { root: true }));
    promises.push(dispatch('user/clearUser', { root: true }));
    promises.push(dispatch('userViews/clearUserViews', { root: true }));

    await Promise.all(promises);
  }
};
