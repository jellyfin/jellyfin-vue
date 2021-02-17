import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree } from 'vuex';
import destr from 'destr';
import {
  defaultState as settingState,
  CustomPreferences
} from '~/store/settings';
/**
 * DisplayPreferencesDto but with our custom typings for CustomPrefs property of DisplayPreferencesDto
 */
export interface ClientPreferences
  extends Omit<DisplayPreferencesDto, 'CustomPrefs'> {
  CustomPrefs?: CustomPreferences;
}

export interface DisplayPreferencesApiState {
  syncing: boolean;
  LastSync: number;
  LastSettingChange: number;
}

const defaultState = (): DisplayPreferencesApiState => ({
  syncing: false,
  LastSync: -1,
  LastSettingChange: -1
});

/**
 * Cast custom preferences returned from the server from strings to the correct Javascript type
 *
 * @param {DisplayPreferencesDto} data - Response from the server
 * @returns {ClientPreferences} - The response with the correct datatypes.
 */
function castResponse(data: DisplayPreferencesDto): ClientPreferences {
  const result = data as ClientPreferences;
  for (const [key, value] of Object.entries(
    result.CustomPrefs as CustomPreferences
  )) {
    /**
     * destr does proper conversion for all the types, even undefined
     */
    // @ts-expect-error - TypeScript can't infer types from Object.entries
    result.CustomPrefs?.[key] = destr(value);
  }
  return result;
}

export const state = defaultState;

export const mutations: MutationTree<DisplayPreferencesApiState> = {
  RESET_STATE(state: DisplayPreferencesApiState) {
    Object.assign(state, defaultState);
  },
  SYNCING_STARTED(state: DisplayPreferencesApiState) {
    state.syncing = true;
  },
  SYNCING_ENDED(state: DisplayPreferencesApiState) {
    state.syncing = false;
    state.LastSync = Date.now();
  },
  UPDATE_CLIENT_SETTINGS(state: DisplayPreferencesApiState) {
    state.LastSettingChange = Date.now();
  }
};

export const actions: ActionTree<
  DisplayPreferencesApiState,
  DisplayPreferencesApiState
> = {
  /**
   * Fetches display preferences and stores them at boot time
   *
   * @param {any} context - Vuex action context
   * @param {any} context.dispatch - Vuex dispatch
   */
  async initState({ commit, dispatch }) {
    if (this.$auth.loggedIn) {
      commit('SYNCING_STARTED');
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

        const data = castResponse(response.data);
        if (data.CustomPrefs) {
          /**
           * We delete the keys that are not defined in the state's default state, so removed
           * values locally don't pollute server's displayPreferences.
           */
          for (const key of Object.keys(data.CustomPrefs)) {
            if (!(key in settingState())) {
              // @ts-expect-error - TypeScript can't infer indexes typings from Object.keys
              delete data.CustomPrefs[key];
            }
          }
          commit(
            'settings/INIT_STATE',
            { data: data.CustomPrefs },
            { root: true }
          );
        }
      } catch (error) {
        const message = this.$i18n.t('failedRetrievingDisplayPreferences');
        dispatch(
          'snackbar/pushSnackbarMessage',
          {
            message,
            color: 'error'
          },
          { root: true }
        );
      }
      commit('SYNCING_ENDED');
    }
  },
  /**
   * Pushes the current state to the server
   *
   * @param {any} context - Vuex action context
   * @param {any} context.state - Vuex state
   * @param {any} context.dispatch - Vuex dispatch
   */
  async pushState({ rootState, commit, dispatch }) {
    if (this.$auth.loggedIn) {
      commit('SYNCING_STARTED');
      try {
        // The fetch part is done because DisplayPreferences doesn't accept partial updates
        const responseFetch = await this.$api.displayPreferences.getDisplayPreferences(
          {
            displayPreferencesId: 'usersettings',
            userId: this.$auth.user?.Id,
            client: 'vue'
          }
        );

        if (responseFetch.status !== 200) {
          throw new Error(
            'get display preferences status response = ' + responseFetch.status
          );
        }

        const displayPrefs = responseFetch.data;
        displayPrefs.CustomPrefs = {};
        // @ts-expect-error - Vuex bad TypeScript support doesn't provide typings for rootState
        const settings = rootState.settings;
        /**
         * For some reason, Vuex adds an 'status' variable to the rootState. We get rid of it.
         */
        if (settings.status) {
          delete settings.status;
        }
        Object.assign(displayPrefs.CustomPrefs, settings);
        for (const [key, value] of Object.entries(displayPrefs.CustomPrefs)) {
          let string = JSON.stringify(value);
          /**
           * Undefined can't be converted to string using JSON.stringify so we add this safeguard
           */
          if (typeof string !== 'string') {
            string = String(string);
          }
          displayPrefs.CustomPrefs[key] = string;
        }

        const response = await this.$api.displayPreferences.updateDisplayPreferences(
          {
            displayPreferencesId: 'usersettings',
            userId: this.$auth.user?.Id,
            client: 'vue',
            displayPreferencesDto: displayPrefs as DisplayPreferencesDto
          }
        );

        if (response.status !== 204) {
          throw new Error(
            'set display preferences status response = ' + response.status
          );
        }
      } catch (error) {
        const message = this.$i18n.t('failedSettingDisplayPreferences');
        dispatch(
          'snackbar/pushSnackbarMessage',
          {
            message,
            color: 'error'
          },
          { root: true }
        );
      }
      commit('SYNCING_ENDED');
    }
  },
  async updateSettings({ commit, dispatch }) {
    commit('UPDATE_CLIENT_SETTINGS');
    await dispatch('pushState');
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
  }
};
