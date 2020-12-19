import { TvShowsState } from './tvShows';
import { ServerState } from './servers';
import { PageState } from './page';
import { SnackbarState } from './snackbar';
import { UserState } from './user';
import { UserViewsState } from './userViews';
import { HomeSectionState } from './homeSection';
import { BackdropState } from './backdrop';
import { DeviceState } from './deviceProfile';
import { DisplayPreferencesState } from './displayPreferences';

export interface AppState {
  tvShows: TvShowsState;
  page: PageState;
  servers: ServerState;
  snackBar: SnackbarState;
  user: UserState;
  userViews: UserViewsState;
  homeSection: HomeSectionState;
  backdrop: BackdropState;
  device: DeviceState;
  displayPreferences: DisplayPreferencesState;
}
