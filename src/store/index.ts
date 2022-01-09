import { MutationTree, ActionTree } from 'vuex';
import { UserDto } from '@jellyfin/client-axios';
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
import { SocketState } from './socket';
import { CollectionsState } from './collections';

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
  collections: CollectionsState;
  user: UserState;
  userViews: UserViewsState;
  socket: SocketState;
}

export const state = (): RootState => ({
  syncing: false
});

export const mutations: MutationTree<RootState> = {
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
    promises.push(dispatch('collections/clearChildren', { root: true }));
    promises.push(dispatch('user/clearUser', { root: true }));
    promises.push(dispatch('userViews/clearUserViews', { root: true }));
    promises.push(dispatch('socket/closeSocket', { root: true }));

    if (clearCritical) {
      promises.push(dispatch('servers/clearServers', { root: true }));
    }

    await Promise.all(promises);
  },
  setSyncStatus({ commit }, value: boolean) {
    commit('SET_SYNC_STATUS', value);
  }
};
