import {
  actions as appActions,
  mutations as appMutations,
  state as appState
} from './app';

const app = {
  namespaced: true,
  actions: appActions,
  mutations: appMutations,
  state: appState
};

export default app;
