import Vue from 'vue';
import { MutationTree } from 'vuex';
import { TvShowsState } from './tvShows';
import { ServerState } from './servers';
import { PageState } from './page';
import { SnackbarState } from './snackbar';
import { UserState } from './user';
import { UserViewsState } from './userViews';
import { HomeSectionState } from './homeSection';
import { BackdropState } from './backdrop';
import { DeviceState } from './deviceProfile';
import { DisplayPreferencesState } from './displayPreferences';

export interface AppState {
  tvShows: TvShowsState;
  page: PageState;
  servers: ServerState;
  snackBar: SnackbarState;
  user: UserState;
  userViews: UserViewsState;
  homeSection: HomeSectionState;
  backdrop: BackdropState;
  device: DeviceState;
  displayPreferences: DisplayPreferencesState;
}

export interface RootState {
  socket: {
    instance: WebSocket | null;
    isConnected: boolean;
    message: Record<string, never>;
    reconnectError: boolean;
  };
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
    console.error(state, event);
  },
  SOCKET_ONMESSAGE(state: RootState, message) {
    Vue.set(state.socket, 'message', message);
  },
  SOCKET_RECONNECT(state: RootState, count: number) {
    console.info(state, count);
  },
  SOCKET_RECONNECT_ERROR(state: RootState) {
    Vue.set(state.socket, 'reconnectError', true);
  }
};
