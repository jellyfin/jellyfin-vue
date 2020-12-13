import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree, GetterTree } from 'vuex';
import nuxtConfig from '~/nuxt.config';

const stringToBoolean = (value: string) => value === 'True';
const booleanToString = (value: boolean) => (value ? 'True' : 'False');

export interface DisplayPreferencesState extends DisplayPreferencesDto {
  CustomPrefs: {
    [key: string]: string;
  };
}

const defaultCustomPrefs: {
  [key: string]: string;
} = {
  darkMode: booleanToString(
    nuxtConfig.vuetify?.theme?.default === 'dark' || false
  ),
  locale: nuxtConfig.i18n?.defaultLocale || 'en'
};

const defaultState = (): DisplayPreferencesState => ({
  CustomPrefs: defaultCustomPrefs
});

const updateMethods: { [key: string]: (value: string) => void } = {
  darkMode: (value: string) => {
    window.$nuxt.$vuetify.theme.dark = stringToBoolean(value);
  },
  locale: (value: string) => {
    window.$nuxt.$i18n.setLocale(value);
  }
};

export const state = defaultState();

interface SingleCustomPrefMutationPayload {
  key: string;
  value: string;
}

export const getters: GetterTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  /**
   * Returns the CustomPrefs object
   *
   * @param {DisplayPreferencesState} state Current state
   * @returns {object} CustomPrefs object
   */
  getCustomPrefs: (state: DisplayPreferencesState) => state.CustomPrefs,

  /**
   * Gets the current dark mode setting as a boolean (default is enabled)
   *
   * @param {DisplayPreferencesState} state Current state
   * @returns {boolean} Current dark mode
   */
  getDarkMode: (state: DisplayPreferencesState) =>
    stringToBoolean(state.CustomPrefs.darkMode)
};

export const mutations: MutationTree<DisplayPreferencesState> = {
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {DisplayPreferencesState} state Current state
   * @param {any} param1 Payload
   * @param {DisplayPreferencesDto} param1.displayPreferences Display preferences returned by the server
   */
  INIT_STATE(
    state: DisplayPreferencesState,
    { displayPreferences }: { displayPreferences: DisplayPreferencesDto }
  ) {
    Object.assign(state, displayPreferences);
    for (const key in defaultCustomPrefs) {
      if (!(key in state.CustomPrefs)) {
        state.CustomPrefs[key] = defaultCustomPrefs[key];
      }
    }
  },

  /**
   * Edits a custom pref key
   *
   * @param {DisplayPreferencesState} state Current state
   * @param {any} param1 Payload
   * @param {SingleCustomPrefMutationPayload} param1.pref Key and value for new custom pref
   */
  EDIT_CUSTOM_PREF(
    state: DisplayPreferencesState,
    { pref }: { pref: SingleCustomPrefMutationPayload }
  ) {
    state.CustomPrefs[pref.key] = pref.value;
    if (pref.key in updateMethods) updateMethods[pref.key](pref.value);
  }
};

export const actions: ActionTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  /**
   * Fetches display preferences, stores them and updates Vuetify dark mode
   *
   * @param {any} param0 Vuex
   * @param {any} param0.commit Vuex commit
   * @param {any} param0.dispatch Vuex dispatch
   */
  async initState({ commit, dispatch }) {
    try {
      const response = await this.$api.displayPreferences.getDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user.Id,
          client: 'vue'
        }
      );

      if (response.status !== 200)
        throw new Error(
          'get display preferences status response = ' + response.status
        );

      commit('INIT_STATE', { displayPreferences: response.data });
    } catch (error) {
      const message = this.$i18n.t('failedRetrievingDisplayPreferences');
      dispatch('requestError', { message, error });
    }
    dispatch('callAllCallbacks');
  },

  /**
   * Pushes the current state to the server
   *
   * @param {any} param0 Vuex
   * @param {any} param0.state Vuex state
   * @param {any} param0.dispatch Vuex dispatch
   */
  async pushState({ state, dispatch }) {
    try {
      const response = await this.$api.displayPreferences.updateDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user.Id,
          client: 'vue',
          displayPreferencesDto: state
        }
      );
      if (response.status !== 204)
        throw new Error(
          'set display preferences status response = ' + response.status
        );
    } catch (error) {
      const message = this.$i18n.t('failedSettingDisplayPreferences');
      dispatch('requestError', { message, error });
    }
  },

  /**
   * Edits a custom preference and pushes it to the server
   *
   * @param {any} param0 Vuex
   * @param {any} param0.commit Vuex commit
   * @param {any} param0.dispatch Vuex dispatch
   * @param {any} param1 Payload
   * @param {string} param1.key Key of custom pref to edit
   * @param {string} param1.value Value to apply
   */
  async editCustomPref(
    { commit, dispatch },
    { key, value }: { key: string; value: string }
  ) {
    commit('EDIT_CUSTOM_PREF', { pref: { key, value } });
    if (this.$auth.loggedIn) await dispatch('pushState');
  },

  /**
   * Resets the state and reapply default theme
   *
   * @param {any} param0 Vuex
   * @param {any} param0.commit Vuex commit
   * @param {any} param0.dispatch Vuex dispatch
   */
  resetState({ commit, dispatch }) {
    commit('INIT_STATE', { displayPreferences: defaultState() });
    dispatch('callAllCallbacks');
  },

  /**
   * Updates the dark mode value of the state and Vuetify and pushes it to the server
   *
   * @param {any} param0 Vuex
   * @param {any} param0.dispatch Vuex dispatch
   * @param {any} param1 Payload
   * @param {boolean} param1.darkMode Dark mode value
   */
  async setDarkMode({ dispatch }, { darkMode }: { darkMode: boolean }) {
    await dispatch('editCustomPref', {
      key: 'darkMode',
      value: booleanToString(darkMode)
    });
  },

  /**
   * Calls all update methods available for our current custom prefs
   *
   * @param {any} param0 Vuex
   * @param {any} param0.state Vuex state
   */
  callAllCallbacks({ state }) {
    Object.keys(state.CustomPrefs).forEach((key) => {
      if (key in updateMethods) updateMethods[key](state.CustomPrefs[key]);
    });
  },

  /**
   * Displays and logs an error
   *
   * @param {any} param0 Vuex
   * @param {any} param0.dispatch Vuex dispatch
   * @param {any} param1 Payload
   * @param {string} param1.message Message to display
   * @param {string} param1.error Error to log
   */
  requestError(
    { dispatch },
    { message, error }: { message: string; error: string }
  ) {
    // eslint-disable-next-line no-console
    console.error(error);
    dispatch(
      'snackbar/pushSnackbarMessage',
      { message, color: 'error' },
      { root: true }
    );
  }
};
