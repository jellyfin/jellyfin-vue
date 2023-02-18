/**
 * Upstream Axios has different typings than @jellyfin/client-axios, so we need to add this comment
 * until @jellyfin/client-axios can be updated to the latest upstream Axios version.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ActivityLogApi,
  ApiKeyApi,
  ArtistsApi,
  AudioApi,
  BrandingApi,
  ChannelsApi,
  CollectionApi,
  Configuration,
  ConfigurationApi,
  DashboardApi,
  DevicesApi,
  DisplayPreferencesApi,
  DlnaApi,
  DlnaServerApi,
  DynamicHlsApi,
  EnvironmentApi,
  FilterApi,
  GenresApi,
  HlsSegmentApi,
  ImageApi,
  ImageByNameApi,
  InstantMixApi,
  ItemLookupApi,
  ItemRefreshApi,
  ItemUpdateApi,
  ItemsApi,
  LibraryApi,
  LibraryStructureApi,
  LiveTvApi,
  LocalizationApi,
  MediaInfoApi,
  MoviesApi,
  MusicGenresApi,
  NotificationsApi,
  PackageApi,
  PersonsApi,
  PlaylistsApi,
  PlaystateApi,
  PluginsApi,
  QuickConnectApi,
  RemoteImageApi,
  ScheduledTasksApi,
  SearchApi,
  SessionApi,
  StartupApi,
  StudiosApi,
  SubtitleApi,
  SuggestionsApi,
  SyncPlayApi,
  SystemApi,
  TimeSyncApi,
  TrailersApi,
  TvShowsApi,
  UniversalAudioApi,
  UserApi,
  UserLibraryApi,
  UserViewsApi,
  VideoAttachmentsApi,
  VideoHlsApi,
  VideosApi,
  YearsApi
} from '@jellyfin/client-axios';

export interface IntroSkipperResponse {
  EpisodeId: string;
  Valid: boolean;
  IntroStart: number;
  IntroEnd: number;
  ShowSkipPromptAt: number;
  HideSkipPromptAt: number;
}

interface ApiPlugin {
  activityLog: ActivityLogApi;
  apiKey: ApiKeyApi;
  artists: ArtistsApi;
  audio: AudioApi;
  branding: BrandingApi;
  channels: ChannelsApi;
  collection: CollectionApi;
  configuration: ConfigurationApi;
  dashboard: DashboardApi;
  devices: DevicesApi;
  displayPreferences: DisplayPreferencesApi;
  dlna: DlnaApi;
  dlnaServer: DlnaServerApi;
  dynamicHls: DynamicHlsApi;
  environment: EnvironmentApi;
  filter: FilterApi;
  genres: GenresApi;
  hlsSegment: HlsSegmentApi;
  image: ImageApi;
  imageByName: ImageByNameApi;
  instantMix: InstantMixApi;
  itemLookup: ItemLookupApi;
  itemRefresh: ItemRefreshApi;
  itemUpdate: ItemUpdateApi;
  items: ItemsApi;
  library: LibraryApi;
  libraryStructure: LibraryStructureApi;
  liveTv: LiveTvApi;
  localization: LocalizationApi;
  mediaInfo: MediaInfoApi;
  movies: MoviesApi;
  musicGenres: MusicGenresApi;
  notifications: NotificationsApi;
  package: PackageApi;
  persons: PersonsApi;
  playlists: PlaylistsApi;
  playState: PlaystateApi;
  plugins: PluginsApi;
  quickConnect: QuickConnectApi;
  remoteImage: RemoteImageApi;
  scheduledTasks: ScheduledTasksApi;
  search: SearchApi;
  session: SessionApi;
  startup: StartupApi;
  studios: StudiosApi;
  subtitle: SubtitleApi;
  suggestions: SuggestionsApi;
  syncPlay: SyncPlayApi;
  system: SystemApi;
  timeSync: TimeSyncApi;
  trailers: TrailersApi;
  tvShows: TvShowsApi;
  universalAudio: UniversalAudioApi;
  user: UserApi;
  userLibrary: UserLibraryApi;
  userViews: UserViewsApi;
  videoAttachments: VideoAttachmentsApi;
  videoHls: VideoHlsApi;
  videos: VideosApi;
  years: YearsApi;
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

export default function (
  context: Context,
  inject: (key: string, value: any) => void
): void {
  const config = new Configuration();
  const contextAxios = context.$axios;

  const api: ApiPlugin = {
    activityLog: new ActivityLogApi(config, '', contextAxios),
    apiKey: new ApiKeyApi(config, '', contextAxios),
    artists: new ArtistsApi(config, '', contextAxios),
    audio: new AudioApi(config, '', contextAxios),
    branding: new BrandingApi(config, '', contextAxios),
    channels: new ChannelsApi(config, '', contextAxios),
    collection: new CollectionApi(config, '', contextAxios),
    configuration: new ConfigurationApi(config, '', contextAxios),
    dashboard: new DashboardApi(config, '', contextAxios),
    devices: new DevicesApi(config, '', contextAxios),
    displayPreferences: new DisplayPreferencesApi(config, '', contextAxios),
    dlna: new DlnaApi(config, '', contextAxios),
    dlnaServer: new DlnaServerApi(config, '', contextAxios),
    dynamicHls: new DynamicHlsApi(config, '', contextAxios),
    environment: new EnvironmentApi(config, '', contextAxios),
    filter: new FilterApi(config, '', contextAxios),
    genres: new GenresApi(config, '', contextAxios),
    hlsSegment: new HlsSegmentApi(config, '', contextAxios),
    image: new ImageApi(config, '', contextAxios),
    imageByName: new ImageByNameApi(config, '', contextAxios),
    instantMix: new InstantMixApi(config, '', contextAxios),
    itemLookup: new ItemLookupApi(config, '', contextAxios),
    itemRefresh: new ItemRefreshApi(config, '', contextAxios),
    itemUpdate: new ItemUpdateApi(config, '', contextAxios),
    items: new ItemsApi(config, '', contextAxios),
    library: new LibraryApi(config, '', contextAxios),
    libraryStructure: new LibraryStructureApi(config, '', contextAxios),
    liveTv: new LiveTvApi(config, '', contextAxios),
    localization: new LocalizationApi(config, '', contextAxios),
    mediaInfo: new MediaInfoApi(config, '', contextAxios),
    movies: new MoviesApi(config, '', contextAxios),
    musicGenres: new MusicGenresApi(config, '', contextAxios),
    notifications: new NotificationsApi(config, '', contextAxios),
    package: new PackageApi(config, '', contextAxios),
    persons: new PersonsApi(config, '', contextAxios),
    playlists: new PlaylistsApi(config, '', contextAxios),
    playState: new PlaystateApi(config, '', contextAxios),
    plugins: new PluginsApi(config, '', contextAxios),
    quickConnect: new QuickConnectApi(config, '', contextAxios),
    remoteImage: new RemoteImageApi(config, '', contextAxios),
    scheduledTasks: new ScheduledTasksApi(config, '', contextAxios),
    search: new SearchApi(config, '', contextAxios),
    session: new SessionApi(config, '', contextAxios),
    startup: new StartupApi(config, '', contextAxios),
    studios: new StudiosApi(config, '', contextAxios),
    subtitle: new SubtitleApi(config, '', contextAxios),
    suggestions: new SuggestionsApi(config, '', contextAxios),
    syncPlay: new SyncPlayApi(config, '', contextAxios),
    system: new SystemApi(config, '', contextAxios),
    timeSync: new TimeSyncApi(config, '', contextAxios),
    trailers: new TrailersApi(config, '', contextAxios),
    tvShows: new TvShowsApi(config, '', contextAxios),
    universalAudio: new UniversalAudioApi(config, '', contextAxios),
    user: new UserApi(config, '', contextAxios),
    userLibrary: new UserLibraryApi(config, '', contextAxios),
    userViews: new UserViewsApi(config, '', contextAxios),
    videoAttachments: new VideoAttachmentsApi(config, '', contextAxios),
    videoHls: new VideoHlsApi(config, '', contextAxios),
    videos: new VideosApi(config, '', contextAxios),
    years: new YearsApi(config, '', contextAxios)
  };

  inject('api', api);
}
