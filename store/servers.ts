import { ActionTree, MutationTree } from 'vuex';

export interface ServerState {
  Id: string;
  LocalAddress: string;
  ServerAddress: string;
  OperatingSystem: string;
  ProductName: string;
  ServerName: string;
  StartupWizardCompleted: boolean;
  Version: string;
}

export const state = (): ServerState => ({
  Id: '',
  LocalAddress: '',
  ServerAddress: '',
  OperatingSystem: '',
  ProductName: '',
  ServerName: '',
  StartupWizardCompleted: true,
  Version: ''
});

interface MutationPayload {
  Id: string;
  LocalAddress: string;
  ServerAddress: string;
  OperatingSystem: string;
  ProductName: string;
  ServerName: string;
  StartupWizardCompleted: boolean;
  Version: string;
}

export const mutations: MutationTree<ServerState> = {
  SET_SERVER(
    state: ServerState,
    {
      Id,
      LocalAddress,
      ServerAddress,
      OperatingSystem,
      ProductName,
      ServerName,
      StartupWizardCompleted,
      Version
    }: MutationPayload
  ) {
    state.Id = Id;
    state.LocalAddress = LocalAddress;
    state.ServerAddress = ServerAddress;
    state.OperatingSystem = OperatingSystem;
    state.ProductName = ProductName;
    state.ServerName = ServerName;
    state.StartupWizardCompleted = StartupWizardCompleted;
    state.Version = Version;
  },
  CLEAR_SERVER(state: ServerState) {
    state.Id = '';
    state.LocalAddress = '';
    state.ServerAddress = '';
    state.OperatingSystem = '';
    state.ProductName = '';
    state.ServerName = '';
    state.StartupWizardCompleted = false;
    state.Version = '';
  }
};

export const actions: ActionTree<ServerState, ServerState> = {
  setServer(
    { commit },
    {
      Id,
      LocalAddress,
      ServerAddress,
      OperatingSystem,
      ProductName,
      ServerName,
      StartupWizardCompleted,
      Version
    }: MutationPayload
  ) {
    commit('SET_SERVER', {
      Id,
      LocalAddress,
      ServerAddress,
      OperatingSystem,
      ProductName,
      ServerName,
      StartupWizardCompleted,
      Version
    });
  },
  clearServer({ commit }) {
    commit('CLEAR_SERVER');
  }
};
