import { InjectionKey } from 'vue';
import {
  createStore,
  Store,
  useStore as baseUseStore,
  Plugin,
  ModuleTree
} from 'vuex';
import app from '~/modules/core/infrastructure/store';
import { AppState } from '~/modules/core/infrastructure/store/app';
import clientSettings from '~/modules/settings/infrastructure/store';
import { ClientSettingsState } from '~/modules/settings/infrastructure/store/clientSettings';

export interface RootState {
  app: AppState;
  clientSettings: ClientSettingsState;
}

export const key: InjectionKey<Store<RootState>> = Symbol();

// Register Vuex plugins here
const plugins: Plugin<RootState>[] = [];

// Register Vuex submodules here
const modules: ModuleTree<RootState> = {
  app: app,
  clientSettings: clientSettings
};

export const store = createStore<RootState>({
  plugins: plugins,
  modules: modules,
  strict: true
});

/**
 * Composable to access the typed Vuex store
 *
 * @export
 * @returns {Store<RootState>} A typed store object
 */
export function useStore(): Store<RootState> {
  return baseUseStore(key);
}
