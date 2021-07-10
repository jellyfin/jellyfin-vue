import { MutationTree } from 'vuex';
import { ClientSettingsState } from '.';
import getDefaultState from './state';

export enum ClientSettingsMutations {
  ResetState = 'RESET_STATE',
  SetState = 'SET_STATE',
  SetLastSyncDate = 'SET_LAST_SYNC_DATE',
  SetDarkMode = 'SET_DARK_MODE',
  SetLocale = 'SET_LOCALE'
}

const mutations: MutationTree<ClientSettingsState> = {
  [ClientSettingsMutations.ResetState](state: ClientSettingsState) {
    Object.assign(state, getDefaultState());
  },
  [ClientSettingsMutations.SetState](
    state: ClientSettingsState,
    { data }: { data: ClientSettingsState }
  ) {
    Object.assign(state, data);
  },
  [ClientSettingsMutations.SetLastSyncDate](
    state: ClientSettingsState,
    { lastSync }: { lastSync: number }
  ) {
    state.lastSync = lastSync;
  },
  [ClientSettingsMutations.SetDarkMode](
    state: ClientSettingsState,
    { darkMode }: { darkMode: boolean }
  ) {
    state.darkMode = darkMode;
  },
  [ClientSettingsMutations.SetLocale](
    state: ClientSettingsState,
    { locale }: { locale: string }
  ) {
    state.locale = locale;
  }
};

export default mutations;
