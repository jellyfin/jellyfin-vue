import { actions } from './actions';
import mutations from './mutations';
import state from './state';

export interface ClientSettingsState {
  darkMode: boolean;
  locale: string;
  lastSync?: number;
}

export { actions, mutations, state };
