import { ClientSettingsState } from '.';

export const getDefaultState = (): ClientSettingsState => ({
  darkMode: true,
  locale: 'auto',
  lastSync: undefined
});

export default getDefaultState;
