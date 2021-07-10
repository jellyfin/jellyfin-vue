import actions from './actions';
import mutations from './mutations';
import state from './state';

export interface AppState {
  // A generic syncing indicator for settings or item syncing to and from the server
  syncing: boolean;
  // Page title
  title: string;
  opaqueAppBar: boolean;
  navDrawer: boolean;
  // Handled by vue-native-websocket
  socket: {
    instance: WebSocket | null;
    isConnected: boolean;
    message: Record<string, never>;
    reconnectError: boolean;
  };
}

// This root store is exported differently than others, since it shouldn't be a submodule.
export { actions, mutations, state };
