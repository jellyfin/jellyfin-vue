import { MutationTree } from 'vuex';
import { AppState } from '.';

export enum CoreMutations {
  OnSocketOpen = 'SOCKET_ONOPEN',
  OnSocketClose = 'SOCKET_ONCLOSE',
  OnSocketError = 'SOCKET_ONERROR',
  OnSocketMessage = 'SOCKET_ONMESSAGE',
  OnSocketReconnect = 'SOCKET_RECONNECT',
  OnSocketReconnectError = 'SOCKET_RECONNECT_ERROR',
  SetSyncStatus = 'SET_SYNC_STATUS',
  SetPageTitle = 'SET_PAGE_TITLE',
  SetBarOpacity = 'SET_BAR_OPACITY',
  SetNavigationDrawerOpacity = 'SET_NAVIGATION_DRAWER_VISIBILITY'
}

const mutations: MutationTree<AppState> = {
  [CoreMutations.OnSocketOpen](state: AppState, event: Event) {
    const socketInstance = event.currentTarget;

    state.socket.instance = socketInstance as WebSocket;
    state.socket.isConnected = true;
    state.socket.reconnectError = false;
  },
  [CoreMutations.OnSocketClose](state: AppState, _event: CloseEvent) {
    state.socket.isConnected = false;
  },
  [CoreMutations.OnSocketError](state: AppState, event: Event) {
    // eslint-disable-next-line no-console
    console.error(state, event);
  },
  [CoreMutations.OnSocketMessage](state: AppState, message) {
    state.socket.message = message;
  },
  [CoreMutations.OnSocketReconnect](state: AppState, count: number) {
    // eslint-disable-next-line no-console
    console.info(state, count);
  },
  [CoreMutations.OnSocketReconnectError](state: AppState) {
    state.socket.reconnectError = true;
  },
  [CoreMutations.SetSyncStatus](state: AppState, value: boolean) {
    state.syncing = value;
  },
  [CoreMutations.SetPageTitle](state: AppState, title: string) {
    state.title = title;
  },
  [CoreMutations.SetBarOpacity](state: AppState, opaqueAppBar: boolean) {
    state.opaqueAppBar = opaqueAppBar;
  },
  [CoreMutations.SetNavigationDrawerOpacity](
    state: AppState,
    showNavDrawer: boolean
  ) {
    state.navDrawer = showNavDrawer;
  }
};

export default mutations;
