import compareVersions from 'compare-versions';
import { ActionTree, MutationTree } from 'vuex';
import { PublicSystemInfo } from '~/api';

export interface ServerInfo {
  address: string;
  publicInfo: PublicSystemInfo;
}

interface ServerState {
  serverUsed: ServerInfo | undefined;
  serverList: ServerInfo[];
}

export const state = (): ServerState => ({
  serverUsed: {
    address: 'http://127.0.0.1:8096/',
    publicInfo: {}
  },
  serverList: []
});

export const mutations: MutationTree<ServerState> = {
  SET_SERVER_USED(state: ServerState, selectedServer: ServerInfo) {
    state.serverUsed = selectedServer;
  },
  ADD_SERVER(state: ServerState, SToadd: ServerInfo) {
    state.serverList = [...state.serverList, SToadd];
  },
  REMOVE_SERVER(state: ServerState, serverId: string) {
    state.serverList = state.serverList.filter(
      (item) => item.publicInfo.Id !== serverId
    );
  }
};

export const actions: ActionTree<ServerState, ServerState> = {
  async connectServer({ dispatch, commit, state }, serverUrl: string) {
    try {
      this.$axios.setBaseURL(serverUrl);

      const { data } = await this.$api.system.getPublicSystemInfo();

      if (compareVersions.compare(data.Version || '', '10.7.0', '>=')) {
        if (!data.StartupWizardCompleted) {
          // Redirect To Startup Wizard
        } else {
          commit('SET_SERVER_USED', {
            publicInfo: data,
            address: serverUrl
          });

          if (!state.serverList.find((x) => x.address === serverUrl)) {
            dispatch('addServer', {
              publicInfo: data,
              address: serverUrl
            });
          }

          this.$router.push('/login');
        }
      } else {
        dispatch('notifyServerVersionIsLow');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err); // in case something inside the try rather than a request failure
      dispatch('notifyServerCantBeFound');
    }
  },
  addServer({ commit }, { address, publicInfo }: ServerInfo) {
    commit('ADD_SERVER', {
      address,
      publicInfo
    });
  },
  removeServer({ commit }, serverInfo) {
    commit('REMOVE_SERVER', serverInfo.publicInfo.Id);
  },
  notifyServerVersionIsLow({ dispatch }) {
    dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: this.$i18n.t('serverVersionTooLow'),
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  notifyServerCantBeFound({ dispatch }) {
    dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: this.$i18n.t('serverNotFound'),
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  notifyNoServerUsed({ dispatch }) {
    dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: this.$i18n.t('serverAddressRequired'),
        color: 'error'
      },
      {
        root: true
      }
    );
  }
};
