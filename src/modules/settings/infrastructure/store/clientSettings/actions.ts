import { ActionTree } from 'vuex';
import { RootState } from '~/plugins/vuex';
import { ClientSettingsState } from '.';
import { ClientSettingsMutations } from './mutations';

export const actions: ActionTree<ClientSettingsState, RootState> = {
  setDarkMode({ commit }, { darkMode }: { darkMode: boolean }) {
    commit(ClientSettingsMutations.SetDarkMode, { darkMode });
  },
  setLocale({ commit }, { locale }: { locale: string }) {
    commit(ClientSettingsMutations.SetLocale, { locale });
  },
  setLastSyncDate({ commit }) {
    // No need to store as a Date, the timestamp is good enough
    commit(ClientSettingsMutations.SetLastSyncDate, { lastSync: Date.now() });
  },
  resetState({ commit }) {
    commit(ClientSettingsMutations.ResetState);
  },
  setState({ commit }, { data }: { data: ClientSettingsState }) {
    commit(ClientSettingsMutations.SetState, { data });
  }
};
