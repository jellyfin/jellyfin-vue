import Vue from 'vue';
import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree, GetterTree } from 'vuex';
import nuxtConfig from '~/nuxt.config';

const stringToBoolean = (value: string): boolean => value === 'True';
const booleanToString = (value: boolean): string => (value ? 'True' : 'False');

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
  locale: 'auto'
};

const defaultState = (): DisplayPreferencesState => ({
  CustomPrefs: defaultCustomPrefs
});

/**
 * Methods to apply for each CustomPrefs property.
 * Those callbacks are usually done on global variables such as $vuetify or $i18n,
 * and those may not be present early in the application lifecycle.
 */
const updateMethods: { [key: string]: (value: string) => void } = {
  darkMode: (value: string) => {
    if (window.$nuxt) window.$nuxt.$vuetify.theme.dark = stringToBoolean(value);
  },

  locale: (value: string) => {
    if (window.$nuxt) {
      if (value !== 'auto') window.$nuxt.$i18n.setLocale(value);
      else window.$nuxt.$i18n.setLocale(navigator.language);
    }
  }
};

export const state = defaultState;

interface SingleCustomPrefMutationPayload {
  key: string;
  value: string;
}

export const getters: GetterTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  /**
   * Anonymous function returned by getBooleanCustomPref
   *
   * @name CustomPrefToBoolean
   * @function
   * @param {string} key - Key of custom property to get parsed to boolean
   * @returns {boolean} Value parsed to bool
   */
  /**
   * Gets a custom preference parsed as a boolean (as bools are stored as string server-side)
   *
   * @param {DisplayPreferencesState} state - Current state
   * @returns {CustomPrefToBoolean} Function to pass the property key to
   */
  getBooleanCustomPref: (state: DisplayPreferencesState) => (
    key: string
  ): boolean => stringToBoolean(state.CustomPrefs[key])
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
    Object.assign(state, displayPreferences);
    for (const key in defaultCustomPrefs) {
      if (!(key in state.CustomPrefs)) {
        Vue.set(state.CustomPrefs, key, defaultCustomPrefs[key]);
      }
    }
  },

  /**
   * Edits a custom pref key
   *
   * @param {DisplayPreferencesState} state - Current state
   * @param {any} param1 - Payload
   * @param {SingleCustomPrefMutationPayload} param1.pref - Key and value for new custom pref
   */
  EDIT_CUSTOM_PREF(
    state: DisplayPreferencesState,
    { pref }: { pref: SingleCustomPrefMutationPayload }
  ) {
    Vue.set(state.CustomPrefs, pref.key, pref.value);
    if (pref.key in updateMethods) updateMethods[pref.key](pref.value);
  }
};

export const actions: ActionTree<
  DisplayPreferencesState,
  DisplayPreferencesState
> = {
  /**
   * Fetches display preferences and stores them
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.dispatch - Vuex dispatch
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

      if (response.status !== 200)
        throw new Error(
          'get display preferences status response = ' + response.status
        );

      await dispatch('initStateSuccess', { displayPreferences: response.data });
    } catch (error) {
      await dispatch('initStateFailure', { error });
    }
  },

  /**
   * On query success, stores the result and call the callbacks
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.commit - Vuex commit
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {DisplayPreferencesDto} param1.displayPreferences - Display preferences object
   */
  async initStateSuccess(
    { commit, dispatch },
    { displayPreferences }: { displayPreferences: DisplayPreferencesDto }
  ) {
    commit('INIT_STATE', { displayPreferences });
    await dispatch('callAllCallbacks');
  },

  /**
   * On query error, sends the error and message to the store logger
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {any} param1.error - Try-catch error
   */
  async initStateFailure({ dispatch }, { error }: { error: unknown }) {
    const message = this.$i18n.t('failedRetrievingDisplayPreferences');
    await dispatch('requestError', { message, error });
  },

  /**
   * Pushes the current state to the server
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.state - Vuex state
   * @param {any} param0.dispatch - Vuex dispatch
   */
  async pushState({ state, dispatch }) {
    try {
      const response = await this.$api.displayPreferences.updateDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user?.Id,
          client: 'vue',
          displayPreferencesDto: state
        }
      );
      if (response.status !== 204)
        throw new Error(
          'set display preferences status response = ' + response.status
        );
      await dispatch('pushStateSuccess');
    } catch (error) {
      await dispatch('pushStateFailure', { error });
    }
  },

  /**
   * Empty function for push state success in case we want to subscribe to it
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  pushStateSuccess() {},

  /**
   * On push failure, logs a message
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {any} param1.error - Try-catch error
   */
  async pushStateFailure({ dispatch }, { error }: { error: unknown }) {
    const message = this.$i18n.t('failedSettingDisplayPreferences');
    await dispatch('requestError', { message, error });
  },

  /**
   * Edits a custom preference and pushes it to the server
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.commit - Vuex commit
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {string} param1.key - Key of custom pref to edit
   * @param {string} param1.value - Value to apply
   */
  async editCustomPref(
    { commit, dispatch },
    { key, value }: { key: string; value: string }
  ) {
    commit('EDIT_CUSTOM_PREF', { pref: { key, value } });
    if (this.$auth.loggedIn) await dispatch('pushState');
  },

  /**
   * Same as editCustomPref, but takes a boolean value and parses it to string so the serve can store it
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {string} param1.key - Key of custom pref to edit
   * @param {boolean} param1.value - Value to apply
   */
  async editBooleanCustomPref(
    { dispatch },
    { key, value }: { key: string; value: boolean }
  ) {
    await dispatch('editCustomPref', { key, value: booleanToString(value) });
  },

  /**
   * Resets the state and reapply default theme
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.commit - Vuex commit
   * @param {any} param0.dispatch - Vuex dispatch
   */
  async resetState({ commit, dispatch }) {
    commit('INIT_STATE', { displayPreferences: defaultState() });
    await dispatch('callAllCallbacks');
  },

  /**
   * Calls all update methods available for our current custom prefs
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.state - Vuex state
   */
  callAllCallbacks({ state }) {
    Object.keys(state.CustomPrefs).forEach((key) => {
      if (key in updateMethods) updateMethods[key](state.CustomPrefs[key]);
    });
  },

  /**
   * Displays and logs an error
   *
   * @param {any} param0 - Vuex
   * @param {any} param0.dispatch - Vuex dispatch
   * @param {any} param1 - Payload
   * @param {string} param1.message - Message to display
   * @param {string} param1.error - Error to log
   */
  async requestError(
    { dispatch },
    { message, error }: { message: string; error: string }
  ) {
    // eslint-disable-next-line no-console
    console.error(error);
    await dispatch(
      'snackbar/pushSnackbarMessage',
      { message, color: 'error' },
      { root: true }
    );
  }
};
