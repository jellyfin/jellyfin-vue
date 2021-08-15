import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import {
  ActivityLogApi,
  ApiKeyApi,
  ArtistsApi,
  BrandingApi,
  Configuration,
  DevicesApi,
  DisplayPreferencesApi,
  FilterApi,
  GenresApi,
  ImageApi,
  ItemRefreshApi,
  ItemUpdateApi,
  ItemsApi,
  LibraryApi,
  LocalizationApi,
  MediaInfoApi,
  MusicGenresApi,
  PersonsApi,
  PlaystateApi,
  RemoteImageApi,
  SearchApi,
  SessionApi,
  StartupApi,
  StudiosApi,
  SystemApi,
  TvShowsApi,
  UserApi,
  UserLibraryApi,
  UserViewsApi
} from '@jellyfin/client-axios';

interface ApiPlugin {
  activityLog: ActivityLogApi;
  apiKey: ApiKeyApi;
  artists: ArtistsApi;
  branding: BrandingApi;
  devices: DevicesApi;
  displayPreferences: DisplayPreferencesApi;
  filter: FilterApi;
  genres: GenresApi;
  image: ImageApi;
  itemRefresh: ItemRefreshApi;
  itemUpdate: ItemUpdateApi;
  items: ItemsApi;
  library: LibraryApi;
  localization: LocalizationApi;
  mediaInfo: MediaInfoApi;
  musicGenres: MusicGenresApi;
  persons: PersonsApi;
  playState: PlaystateApi;
  remoteImage: RemoteImageApi;
  search: SearchApi;
  session: SessionApi;
  startup: StartupApi;
  studios: StudiosApi;
  system: SystemApi;
  tvShows: TvShowsApi;
  user: UserApi;
  userLibrary: UserLibraryApi;
  userViews: UserViewsApi;
}

declare module '@nuxt/types' {
  interface Context {
    $api: ApiPlugin;
  }

  interface NuxtAppOptions {
    $api: ApiPlugin;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $api: ApiPlugin;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $api: ApiPlugin;
  }
}

const apiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();
  const contextAxios = context.$axios as AxiosInstance;

  const api: ApiPlugin = {
    activityLog: new ActivityLogApi(config, '', contextAxios),
    apiKey: new ApiKeyApi(config, '', contextAxios),
    artists: new ArtistsApi(config, '', contextAxios),
    branding: new BrandingApi(config, '', contextAxios),
    devices: new DevicesApi(config, '', contextAxios),
    displayPreferences: new DisplayPreferencesApi(config, '', contextAxios),
    filter: new FilterApi(config, '', contextAxios),
    genres: new GenresApi(config, '', contextAxios),
    image: new ImageApi(config, '', contextAxios),
    itemRefresh: new ItemRefreshApi(config, '', contextAxios),
    itemUpdate: new ItemUpdateApi(config, '', contextAxios),
    items: new ItemsApi(config, '', contextAxios),
    library: new LibraryApi(config, '', contextAxios),
    localization: new LocalizationApi(config, '', contextAxios),
    mediaInfo: new MediaInfoApi(config, '', contextAxios),
    musicGenres: new MusicGenresApi(config, '', contextAxios),
    persons: new PersonsApi(config, '', contextAxios),
    playState: new PlaystateApi(config, '', contextAxios),
    remoteImage: new RemoteImageApi(config, '', contextAxios),
    search: new SearchApi(config, '', contextAxios),
    session: new SessionApi(config, '', contextAxios),
    startup: new StartupApi(config, '', contextAxios),
    studios: new StudiosApi(config, '', contextAxios),
    system: new SystemApi(config, '', contextAxios),
    tvShows: new TvShowsApi(config, '', contextAxios),
    user: new UserApi(config, '', contextAxios),
    userLibrary: new UserLibraryApi(config, '', contextAxios),
    userViews: new UserViewsApi(config, '', contextAxios)
  };

  inject('api', api);
};

export default apiPlugin;
