import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree, GetterTree } from 'vuex';

export interface DisplayPreferencesState extends DisplayPreferencesDto {
  CustomPrefs: {
    [key: string]: string;
  };
}

const defaultCustomPrefs: {
  [key: string]: string;
} = {
  darkMode: 'True'
};

const defaultState = (): DisplayPreferencesState => ({
  CustomPrefs: defaultCustomPrefs
});

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
    state.CustomPrefs.darkMode === 'True'
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
  },

  /**
   * Drops a custom pref key
   *
   * @param {DisplayPreferencesState} state Current state
   * @param {any} param1 Payload
   * @param {string} param1.key Key to drop
   */
  DROP_CUSTOM_PREF(state: DisplayPreferencesState, { key }: { key: string }) {
    delete state.CustomPrefs[key];
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
    const response = await this.$api.displayPreferences.getDisplayPreferences({
      displayPreferencesId: 'usersettings',
      userId: this.$auth.user.Id,
      client: 'vue'
    });
    commit('INIT_STATE', { displayPreferences: response.data });
    await dispatch('updateDarkMode', {});
  },

  /**
   * Pushes the current state to the server
   *
   * @param {any} param0 Vuex
   * @param {any} param0.state Vuex state
   */
  async pushState({ state }) {
    const response = await this.$api.displayPreferences.updateDisplayPreferences(
      {
        displayPreferencesId: 'usersettings',
        userId: this.$auth.user.Id,
        client: 'vue',
        displayPreferencesDto: state
      }
    );
    if (response.status !== 204) {
      console.error("Can't updated displayPreferences");
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
    await dispatch('pushState');
  },

  /**
   * Deletes a custom preference and pushes it to the server
   *
   * @param {any} param0 Vuex
   * @param {any} param0.commit Vuex commit
   * @param {any} param0.dispatch Vuex dispatch
   * @param {any} param1 Payload
   * @param {string} param1.key Key to delete
   */
  async dropCustomPref({ commit, dispatch }, { key }: { key: string }) {
    commit('DROP_CUSTOM_PREF', { key });
    await dispatch('pushState');
  },

  /**
   * Resets the state and reapply default theme
   *
   * @param {any} param0 Vuex
   * @param {any} param0.commit Vuex commit
   * @param {any} param0.dispatch Vuex dispatch
   */
  async resetState({ commit, dispatch }) {
    commit('INIT_STATE', { displayPreferences: defaultState() });
    await dispatch('updateDarkMode', {});
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
    await dispatch('updateDarkMode', { forceDarkMode: darkMode });
    await dispatch('editCustomPref', {
      key: 'darkMode',
      value: darkMode ? 'True' : 'False'
    });
  },

  /**
   * Updates the Vuetify dark mode setting based on:
   * the parameter if given
   * the current state if no parameter is given
   *
   * @param {any} param0 Vuex
   * @param {any} param0.getters Vuex getters
   * @param {any} param1 Payload
   * @param {boolean | undefined} param1.forceDarkMode Dark mode setting
   */
  updateDarkMode({ getters }, { forceDarkMode }: { forceDarkMode?: boolean }) {
    if (forceDarkMode === undefined)
      window.$nuxt.$vuetify.theme.dark = getters.getDarkMode;
    else window.$nuxt.$vuetify.theme.dark = forceDarkMode;
  }
};
