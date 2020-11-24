import { ActionTree, MutationTree } from 'vuex';
import { PublicSystemInfo } from '~/api';

export interface ServerInfo {
  address: string;
  publicInfo: PublicSystemInfo;
}

interface ServerState {
  serverList: ServerInfo[];
}

export const state = (): ServerState => ({
  serverList: []
});

export const mutations: MutationTree<ServerState> = {
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
  addServer({ commit }, { address, publicInfo }: ServerInfo) {
    commit('ADD_SERVER', {
      address,
      publicInfo
    });
  },
  removeServer({ commit }, serverInfo) {
    commit('REMOVE_SERVER', serverInfo.publicInfo.Id);
  }
};
