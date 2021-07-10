import { AppState } from '.';

const state: AppState = {
  syncing: false,
  title: 'Jellyfin',
  opaqueAppBar: true,
  navDrawer: true,
  socket: {
    instance: null,
    isConnected: false,
    message: {},
    reconnectError: false
  }
};

export default state;
