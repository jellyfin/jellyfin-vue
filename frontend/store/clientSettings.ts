import { MutationTree, ActionTree } from 'vuex';
import nuxtConfig from '~/nuxt.config';

/**
 * Cast typings for the CustomPrefs property of DisplayPreferencesDto
 */
export interface ClientSettingsState {
  darkMode: boolean;
  locale: string;
  lastSync: number | null;
}

export const getDefaultState = (): ClientSettingsState => ({
  darkMode:
    nuxtConfig.vuetify?.theme?.dark !== undefined
      ? nuxtConfig.vuetify?.theme?.dark
      : true,
  locale: 'auto',
  lastSync: null
});

export const state = getDefaultState;

export const mutations: MutationTree<ClientSettingsState> = {
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {ClientSettingsState} state - Current state
   */
  RESET_STATE(state: ClientSettingsState) {
    Object.assign(state, getDefaultState());
  },
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {ClientSettingsState} state - Current state
   * @param {any} payload - Payload
   */
  INIT_STATE(
    state: ClientSettingsState,
    { data }: { data: ClientSettingsState }
  ) {
    Object.assign(state, data);
  },
  SET_LAST_SYNC_DATE(
    state: ClientSettingsState,
    { lastSync }: { lastSync: number }
  ) {
    state.lastSync = lastSync;
  },
  SET_DARK_MODE(
    state: ClientSettingsState,
    { darkMode }: { darkMode: boolean }
  ) {
    state.darkMode = darkMode;
  },
  SET_LOCALE(state: ClientSettingsState, { locale }: { locale: string }) {
    state.locale = locale;
  }
};

export const actions: ActionTree<ClientSettingsState, ClientSettingsState> = {
  setDarkMode({ commit }, { darkMode }: { darkMode: boolean }) {
    commit('SET_DARK_MODE', { darkMode });
  },
  setLocale({ commit }, { locale }: { locale: string }) {
    commit('SET_LOCALE', { locale });
  },
  setLastSyncDate({ commit }) {
    // No need to store as a Date, the timestamp is good enough
    commit('SET_LAST_SYNC_DATE', { lastSync: Date.now() });
  },
  /**
   * Resets the state and reapply default theme
   *
   * @param {any} context - Vuex action context
   * @param {any} context.commit - Vuex commit
   * @param {any} context.dispatch - Vuex dispatch
   */
  resetState({ commit }) {
    commit('RESET_STATE');
  },
  initState({ commit }, { data }: { data: ClientSettingsState }) {
    commit('INIT_STATE', { data });
  }
};
