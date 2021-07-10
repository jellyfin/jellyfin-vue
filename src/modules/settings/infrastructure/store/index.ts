import {
  actions as clientSettingsActions,
  mutations as clientSettingsMutations,
  state as clientSettingsState
} from './clientSettings';

const clientSettings = {
  namespaced: true,
  actions: clientSettingsActions,
  mutations: clientSettingsMutations,
  state: clientSettingsState
};

export default clientSettings;
