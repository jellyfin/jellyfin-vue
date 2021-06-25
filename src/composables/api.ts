import { inject } from 'vue';
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
import { AxiosInstance } from 'axios';
import { AxiosSymbol } from '../plugins/axios';

const axios: AxiosInstance = inject(AxiosSymbol) as AxiosInstance;

const configuration = new Configuration({});

export function useActivityLogApi(): ActivityLogApi {
  return new ActivityLogApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useApiKeyApi(): ApiKeyApi {
  return new ApiKeyApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useArtistsApi(): ArtistsApi {
  return new ArtistsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useAudioApi(): AudioApi {
  return new AudioApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useBrandingApi(): BrandingApi {
  return new BrandingApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useCollectionApi(): CollectionApi {
  return new CollectionApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useChannelsApi(): ChannelsApi {
  return new ChannelsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useConfigurationApi(): ConfigurationApi {
  return new ConfigurationApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDashboardApi(): DashboardApi {
  return new DashboardApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDevicesApi(): DevicesApi {
  return new DevicesApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDisplayPreferencesApi(): DisplayPreferencesApi {
  return new DisplayPreferencesApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDlnaApi(): DlnaApi {
  return new DlnaApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDlnaServerApi(): DlnaServerApi {
  return new DlnaServerApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useDynamicHlsApi(): DynamicHlsApi {
  return new DynamicHlsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useEnvironmentApi(): EnvironmentApi {
  return new EnvironmentApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useFilterApi(): FilterApi {
  return new FilterApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useGenresApi(): GenresApi {
  return new GenresApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useHlsSegmentApi(): HlsSegmentApi {
  return new HlsSegmentApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useImageApi(): ImageApi {
  return new ImageApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useImageByNameApi(): ImageByNameApi {
  return new ImageByNameApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useInstantMixApi(): InstantMixApi {
  return new InstantMixApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useItemLookupApi(): ItemLookupApi {
  return new ItemLookupApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useItemRefreshApi(): ItemRefreshApi {
  return new ItemRefreshApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useItemUpdateApi(): ItemUpdateApi {
  return new ItemUpdateApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useItemsApi(): ItemsApi {
  return new ItemsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useLibraryApi(): LibraryApi {
  return new LibraryApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useLibraryStructureApi(): LibraryStructureApi {
  return new LibraryStructureApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useLiveTvApi(): LiveTvApi {
  return new LiveTvApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useLocalizationApi(): LocalizationApi {
  return new LocalizationApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useMediaInfoApi(): MediaInfoApi {
  return new MediaInfoApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useMoviesApi(): MoviesApi {
  return new MoviesApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useMusicGenresApi(): MusicGenresApi {
  return new MusicGenresApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useNotificationsApi(): NotificationsApi {
  return new NotificationsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function usePackageApi(): PackageApi {
  return new PackageApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function usePersonsApi(): PersonsApi {
  return new PersonsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function usePlaylistsApi(): PlaylistsApi {
  return new PlaylistsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function usePlaystateApi(): PlaystateApi {
  return new PlaystateApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function usePluginsApi(): PluginsApi {
  return new PluginsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useQuickConnectApi(): QuickConnectApi {
  return new QuickConnectApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useRemoteImageApi(): RemoteImageApi {
  return new RemoteImageApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useScheduledTasksApi(): ScheduledTasksApi {
  return new ScheduledTasksApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSearchApi(): SearchApi {
  return new SearchApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSessionApi(): SessionApi {
  return new SessionApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useStartupApi(): StartupApi {
  return new StartupApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useStudiosApi(): StudiosApi {
  return new StudiosApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSubtitleApi(): SubtitleApi {
  return new SubtitleApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSuggestionsApi(): SuggestionsApi {
  return new SuggestionsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSyncPlayApi(): SyncPlayApi {
  return new SyncPlayApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useSystemApi(): SystemApi {
  return new SystemApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useTimeSyncApi(): TimeSyncApi {
  return new TimeSyncApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useTrailersApi(): TrailersApi {
  return new TrailersApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useTvShowsApi(): TvShowsApi {
  return new TvShowsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useUniversalAudioApi(): UniversalAudioApi {
  return new UniversalAudioApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useUserApi(): UserApi {
  return new UserApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useUserLibraryApi(): UserLibraryApi {
  return new UserLibraryApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useUserViewsApi(): UserViewsApi {
  return new UserViewsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useVideoAttachmentsApi(): VideoAttachmentsApi {
  return new VideoAttachmentsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useVideoHlsApi(): VideoHlsApi {
  return new VideoHlsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useVideosApi(): VideosApi {
  return new VideosApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}

export function useYearsApi(): YearsApi {
  return new YearsApi(
    configuration,
    axios.defaults.baseURL,
    /* @ts-expect-error -- Outdated Axios version in the API client */
    axios as AxiosInstance
  );
}
