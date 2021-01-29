import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree, GetterTree } from 'vuex';
import { merge } from 'lodash';
import { boolean } from 'boolean';
import nuxtConfig from '~/nuxt.config';

export interface DisplayPreferencesState {
  darkMode: string;
  locale: 'auto' | string;
}

const defaultState = (): DisplayPreferencesState => ({
  darkMode: String(nuxtConfig.vuetify?.theme?.default === 'dark'),
  locale: 'auto'
});

export const state = defaultState;

export const getters: GetterTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  getDarkMode: (state) => {
    return boolean(state.darkMode);
  },
  getLocale: (state) => {
    return state.locale;
  }
};

export const mutations: MutationTree<DisplayPreferencesState> = {
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {DisplayPreferencesState} state - Current state
   * @param {any} param1 - Payload
   * @param {DisplayPreferencesDto} param1.displayPreferences - Display preferences returned by the server
   */
  INIT_STATE(
    state: DisplayPreferencesState,
    { displayPreferences }: { displayPreferences: DisplayPreferencesDto }
  ) {
    merge(state, displayPreferences.CustomPrefs);
  },
  SET_DARK_MODE(
    state: DisplayPreferencesState,
    { darkMode }: { darkMode: boolean }
  ) {
    state.darkMode = darkMode.toString();
  },
  SET_LOCALE(state: DisplayPreferencesState, { locale }: { locale: string }) {
    state.locale = locale;
  }
};

export const actions: ActionTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  /**
   * Fetches display preferences and stores them
   *
   * @param {any} context - Vuex action context
   * @param {any} context.dispatch - Vuex dispatch
   */
  async initState({ dispatch }) {
    try {
      const response = await this.$api.displayPreferences.getDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user?.Id,
          client: 'vue'
        }
      );

      if (response.status !== 200) {
        throw new Error(
          'get display preferences status response = ' + response.status
        );
      }

      await dispatch('initStateSuccess', { displayPreferences: response.data });
    } catch (error) {
      await dispatch('initStateFailure', { error });
    }
  },
  /**
   * On query success, stores the result and call the callbacks
   *
   * @param {any} context - Vuex action context
   * @param {any} context.commit - Vuex commit
   * @param {any} context.dispatch - Vuex dispatch
   * @param {any} payload - Payload
   * @param {DisplayPreferencesDto} payload.displayPreferences - Display preferences object
   */
  initStateSuccess(
    { commit },
    { displayPreferences }: { displayPreferences: DisplayPreferencesDto }
  ) {
    commit('INIT_STATE', { displayPreferences });
  },
  /**
   * On query error, sends the error and message to the store logger
   *
   * @param {any} context - Vuex action context
   * @param {any} context.dispatch - Vuex dispatch
   */
  async initStateFailure({ dispatch }) {
    const message = this.$i18n.t('failedRetrievingDisplayPreferences');
    await dispatch(
      'snackbar/pushSnackbarMessage',
      { message, color: 'error' },
      { root: true }
    );
  },
  /**
   * Pushes the current state to the server
   *
   * @param {any} context - Vuex action context
   * @param {any} context.state - Vuex state
   * @param {any} context.dispatch - Vuex dispatch
   */
  async pushState({ state, dispatch }) {
    try {
      const response = await this.$api.displayPreferences.updateDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user?.Id,
          client: 'vue',
          displayPreferencesDto: {
            CustomPrefs: {
              darkMode: state.darkMode,
              locale: state.locale
            }
          }
        }
      );
      if (response.status !== 204) {
        throw new Error(
          'set display preferences status response = ' + response.status
        );
      }
    } catch (error) {
      await dispatch('pushStateFailure', { error });
    }
  },
  /**
   * On push failure, logs a message
   *
   * @param {any} context - Vuex action context
   * @param {any} context.dispatch - Vuex dispatch
   */
  async pushStateFailure({ dispatch }) {
    const message = this.$i18n.t('failedSettingDisplayPreferences');
    await dispatch(
      'snackbar/pushSnackbarMessage',
      { message, color: 'error' },
      { root: true }
    );
  },
  async setDarkMode({ commit, dispatch }, { darkMode }: { darkMode: boolean }) {
    commit('SET_DARK_MODE', { darkMode });
    if (this.$auth.loggedIn) await dispatch('pushState');
  },
  async setLocale({ commit, dispatch }, { locale }: { locale: string }) {
    commit('SET_LOCALE', { locale });
    if (this.$auth.loggedIn) await dispatch('pushState');
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
