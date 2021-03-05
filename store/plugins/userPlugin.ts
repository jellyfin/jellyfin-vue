import { Plugin } from 'vuex';
import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import destr from 'destr';
import { AppState } from '..';
import {
  ClientSettingsState,
  getDefaultState as settingState
} from '~/store/clientSettings';

export interface ClientPreferences
  extends Omit<DisplayPreferencesDto, 'CustomPrefs'> {
  CustomPrefs?: ClientSettingsState;
}

export interface DisplayPreferencesApiState {
  syncing: boolean;
  LastSync: number;
  LastSettingChange: number;
}

/**
 * Cast custom preferences returned from the server from strings to the correct Javascript type
 *
 * @param {DisplayPreferencesDto} data - Response from the server
 * @returns {ClientPreferences} - The response with the correct datatypes.
 */
function castResponse(data: DisplayPreferencesDto): ClientPreferences {
  const result = data as ClientPreferences;
  for (const [key, value] of Object.entries(
    result.CustomPrefs as ClientSettingsState
  )) {
    /**
     * destr does proper conversion for all the types, even undefined
     */
    // @ts-expect-error - TypeScript can't infer types from Object.entries
    result.CustomPrefs[key] = destr(value);
  }
  return result;
}

export const userPlugin: Plugin<AppState> = (store) => {
  store.subscribe(async (mutation, _state) => {
    // When login happen and is finished
    if (
      mutation.type === 'auth/SET' &&
      mutation.payload.key === 'busy' &&
      mutation.payload.value === false &&
      store.$auth.loggedIn
    ) {
      try {
        // Fetch the user's preferences
        const response = await store.$api.displayPreferences.getDisplayPreferences(
          {
            displayPreferencesId: 'clientsettings',
            userId: store.$auth.user?.Id,
            client: 'vue'
          }
        );

        if (response.status !== 200) {
          throw new Error(
            `Unexpected API response code when fetching client preferences (${response.status})`
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
          store.dispatch(
            'clientSettings/initState',
            { data: data.CustomPrefs },
            { root: true }
          );
        }
      } catch (error) {
        const message = store.$i18n.t('failedRetrievingDisplayPreferences');
        store.dispatch(
          'snackbar/pushSnackbarMessage',
          {
            message,
            color: 'error'
          },
          { root: true }
        );
      }
    }
    // When logout happens and is finished
    else if (
      mutation.type === 'auth/SET' &&
      mutation.payload.key === 'busy' &&
      mutation.payload.value === false &&
      !store.$auth.loggedIn
    ) {
      store.dispatch('reset', { clearCritical: false }, { root: true });
    }
  });
};
