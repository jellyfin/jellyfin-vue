import { MutationTree, ActionTree } from 'vuex';
import nuxtConfig from '~/nuxt.config';

/**
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */
export interface CustomPreferences {
  darkMode: boolean;
  locale: string;
}

export const defaultState = (): CustomPreferences => ({
  darkMode:
    nuxtConfig.vuetify?.theme?.dark !== undefined
      ? nuxtConfig.vuetify?.theme?.dark
      : true,
  locale: 'auto'
});

export const state = defaultState;

export const mutations: MutationTree<CustomPreferences> = {
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {CustomPreferences} state - Current state
   * @param {any} param1 - Payload
   */
  INIT_STATE(state: CustomPreferences, { data }: { data: CustomPreferences }) {
    Object.assign(state, data);
  },
  SET_DARK_MODE(state: CustomPreferences, { darkMode }: { darkMode: boolean }) {
    state.darkMode = darkMode;
  },
  SET_LOCALE(state: CustomPreferences, { locale }: { locale: string }) {
    state.locale = locale;
  }
};

export const actions: ActionTree<CustomPreferences, CustomPreferences> = {
  setDarkMode({ commit, dispatch }, { darkMode }: { darkMode: boolean }) {
    commit('SET_DARK_MODE', { darkMode });
    dispatch('displayPreferencesApi/updateSettings', null, { root: true });
  },
  setLocale({ commit, dispatch }, { locale }: { locale: string }) {
    commit('SET_LOCALE', { locale });
    dispatch('displayPreferencesApi/updateSettings', null, { root: true });
  },
  /**
   * Resets the state and reapply default theme
   *
   * @param {any} context - Vuex action context
   * @param {any} context.commit - Vuex commit
   * @param {any} context.dispatch - Vuex dispatch
   */
  resetState({ commit }) {
    commit('INIT_STATE', { displayPreferences: defaultState() });
  }
};
