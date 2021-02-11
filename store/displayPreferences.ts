import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { MutationTree, ActionTree } from 'vuex';
import { merge, toString as toStr } from 'lodash';
import { boolean } from 'boolean';

/**
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */
interface CustomPreferences {
  darkMode: boolean;
  locale: string;
}
/**
 * DisplayPreferencesDto but with our custom typings for CustomPrefs property of DisplayPreferencesDto
 */
export interface ClientPreferences
  extends Omit<DisplayPreferencesDto, 'CustomPrefs'> {
  CustomPrefs?: CustomPreferences;
}
export interface DisplayPreferencesState extends CustomPreferences {
  syncing: boolean;
}

const defaultState = (): DisplayPreferencesState => ({
  darkMode: true,
  locale: 'auto',
  syncing: false
});

/**
 * Convert custom preferences returned from the server in the correct type
 *
 * @param {DisplayPreferencesDto} data - Response from the server
 * @returns {ClientPreferences} - The response with the correct datatypes.
 */
function castResponse(data: DisplayPreferencesDto): ClientPreferences {
  const result = data as ClientPreferences;
  if (result.CustomPrefs?.darkMode) {
    result.CustomPrefs.darkMode = boolean(result.CustomPrefs.darkMode);
  }
  return result;
}

export const state = defaultState;

export const mutations: MutationTree<DisplayPreferencesState> = {
  /**
   * Sets the internal state with the server answer and assign default custom prefs if not existing
   *
   * @param {DisplayPreferencesState} state - Current state
   * @param {any} param1 - Payload
   * @param {ClientPreferences} param1.displayPreferences - Display preferences returned by the server
   */
  INIT_STATE(
    state: DisplayPreferencesState,
    { displayPreferences }: { displayPreferences: ClientPreferences }
  ) {
    merge(state, displayPreferences.CustomPrefs);
  },
  SET_DARK_MODE(
    state: DisplayPreferencesState,
    { darkMode }: { darkMode: boolean }
  ) {
    state.darkMode = darkMode;
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
  async initState({ dispatch, commit }) {
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

      commit('INIT_STATE', { displayPreferences: data });
    } catch (error) {
      const message = this.$i18n.t('failedRetrievingDisplayPreferences');
      await dispatch(
        'snackbar/pushSnackbarMessage',
        { message, color: 'error' },
        { root: true }
      );
    }
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
      // The fetch part is done because DisplayPreferences doesn't accept partial updates
      const responseFetch = await this.$api.displayPreferences.getDisplayPreferences(
        {
          displayPreferencesId: 'usersettings',
          userId: this.$auth.user?.Id,
          client: 'vue'
        }
      );

      if (responseFetch.status !== 200)
        throw new Error(
          'get display preferences status response = ' + responseFetch.status
        );

      const displayPrefs = responseFetch.data;

      if (displayPrefs.CustomPrefs) {
        Object.assign(state, displayPrefs.CustomPrefs);
        for (const [key, value] of Object.entries(displayPrefs.CustomPrefs)) {
          /**
           * As TypeScript typings are erased at runtime, we can't rely on typings to distinguish between
           * the variables that belong just to the store and the ones that we want to be synced to the server.
           *
           * We can overcome this limitation in the future by storing our prefs in another store and leaving this store
           * just for the API calls.
           */
          if (key === 'syncing') {
            delete displayPrefs.CustomPrefs[key];
            continue;
          }
          displayPrefs.CustomPrefs[key] = toStr(value);
        }
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
      await dispatch(
        'snackbar/pushSnackbarMessage',
        { message, color: 'error' },
        { root: true }
      );
    }
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
