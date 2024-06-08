/**
 * Item and playback helpers
 */
import {
  BaseItemKind,
  ItemFields,
  ItemSortBy,
  type BaseItemDto,
  type BaseItemPerson,
  type MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import IMdiAccount from 'virtual:icons/mdi/account';
import IMdiAlbum from 'virtual:icons/mdi/album';
import IMdiBookMusic from 'virtual:icons/mdi/book-music';
import IMdiBookOpenPageVariant from 'virtual:icons/mdi/book-open-page-variant';
import IMdiFilmstrip from 'virtual:icons/mdi/filmstrip';
import IMdiFolder from 'virtual:icons/mdi/folder';
import IMdiFolderMultiple from 'virtual:icons/mdi/folder-multiple';
import IMdiImage from 'virtual:icons/mdi/image';
import IMdiImageMultiple from 'virtual:icons/mdi/image-multiple';
import IMdiMovie from 'virtual:icons/mdi/movie';
import IMdiMusic from 'virtual:icons/mdi/music';
import IMdiMusicBox from 'virtual:icons/mdi/music-box';
import IMdiMusicNote from 'virtual:icons/mdi/music-note';
import IMdiPlaylistPlay from 'virtual:icons/mdi/playlist-play';
import IMdiTelevisionClassic from 'virtual:icons/mdi/television-classic';
import IMdiYoutube from 'virtual:icons/mdi/youtube';
import IMdiYoutubeTV from 'virtual:icons/mdi/youtube-tv';
import type { ComputedRef } from 'vue';
import type { RouteNamedMap } from 'vue-router/auto-routes';
import { ticksToMs } from './time';
import { isNil } from '@/utils/validation';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';
import { useBaseItem } from '@/composables/apis';

/**
 * A list of valid collections that should be treated as folders.
 */
export const validLibraryTypes: BaseItemKind[] = [
  BaseItemKind.CollectionFolder,
  BaseItemKind.Folder,
  BaseItemKind.UserView,
  BaseItemKind.Playlist,
  BaseItemKind.PhotoAlbum
];

export const validPersonTypes = [
  'Actor',
  'Director',
  'Composer',
  'Writer',
  'GuestStar',
  'Producer',
  'Conductor',
  'Lyricist'
];

export enum CardShapes {
  Portrait = 'portrait-card',
  Thumb = 'thumb-card',
  Square = 'square-card',
  Banner = 'banner-card'
}

/**
 * This sortOrder is commonly used across many requests. Define it here so it can be
 * used in multiple places without repeating the same code.
 */
export const defaultSortOrder = [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName];

/**
 * Determines if the item is a person
 *
 * @param item - The item to be checked.
 * @returns Whether the provided item is of type BaseItemPerson.
 */
export function isPerson(
  item: BaseItemDto | BaseItemPerson
): item is BaseItemPerson {
  return !!(
    'Role' in item
    || (item.Type && validPersonTypes.includes(item.Type))
  );
}

/**
 * Checks if the item is a library
 */
export function isLibrary(item: BaseItemDto): boolean {
  return item.Type ? validLibraryTypes.includes(item.Type) : false;
}

/**
 * Get the Material Design Icon name associated with a type of library
 *
 * @returns Name of the Material Design Icon associated with the type
 */
export function getLibraryIcon(
  libraryType: string | undefined | null
): typeof IMdiMovie {
  switch (libraryType?.toLowerCase()) {
    case 'movies': {
      return IMdiMovie;
    }
    case 'music': {
      return IMdiMusic;
    }
    case 'photos': {
      return IMdiImage;
    }
    case 'livetv': {
      return IMdiYoutubeTV;
    }
    case 'tvshows': {
      return IMdiTelevisionClassic;
    }
    case 'homevideos': {
      return IMdiImageMultiple;
    }
    case 'musicvideos': {
      return IMdiMusicBox;
    }
    case 'books': {
      return IMdiBookOpenPageVariant;
    }
    case 'channels': {
      return IMdiYoutube;
    }
    case 'playlists': {
      return IMdiPlaylistPlay;
    }
    default: {
      return IMdiFolder;
    }
  }
}

/**
 * Get the card shape associated with a collection type
 *
 * @returns CSS class to use as the shape of the card
 */
export function getShapeFromCollectionType(
  collectionType: string | null | undefined
): CardShapes {
  switch (collectionType?.toLowerCase()) {
    case 'livetv':
    case 'musicvideos': {
      return CardShapes.Thumb;
    }
    case 'folders':
    case 'playlists':
    case 'music': {
      return CardShapes.Square;
    }
    default: {
      return CardShapes.Portrait;
    }
  }
}

/**
 * Gets the card shape associated with a collection type
 *
 * @returns CSS class to use as the shape of the card
 */
export function getShapeFromItemType(
  itemType: BaseItemKind | null | undefined
): CardShapes {
  if (!itemType) {
    return CardShapes.Portrait;
  }

  switch (itemType) {
    case BaseItemKind.Audio:
    case BaseItemKind.Folder:
    case BaseItemKind.MusicAlbum:
    case BaseItemKind.MusicArtist:
    case BaseItemKind.MusicGenre:
    case BaseItemKind.PhotoAlbum:
    case BaseItemKind.Playlist:
    case BaseItemKind.Video: {
      return CardShapes.Square;
    }
    case BaseItemKind.Episode:
    case BaseItemKind.MusicVideo:
    case BaseItemKind.CollectionFolder:
    case BaseItemKind.Studio: {
      return CardShapes.Thumb;
    }
    default: {
      return CardShapes.Portrait;
    }
  }
}

/**
 * Determine if an item can be identified.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be identified or not.
 */
export function canIdentify(item: BaseItemDto): boolean {
  const valid = [
    'Book',
    'BoxSet',
    'Movie',
    'MusicAlbum',
    'MusicArtist',
    'MusicVideo',
    'Person',
    'Series',
    'Trailer'
  ];

  return valid.includes(item.Type || '');
}

/**
 * Test if the passed item can be played by one of the players in the client.
 *
 * @param item - The item to be tested for playback support
 * @returns Whether the item can be played on this client or not
 */
export function canPlay(item: BaseItemDto | undefined): boolean {
  if (item === undefined) {
    return false;
  }

  return !!(
    [
      'Audio',
      'AudioBook',
      'BoxSet',
      'Episode',
      'Movie',
      'MusicAlbum',
      'MusicArtist',
      'MusicGenre',
      'MusicVideo',
      'Playlist',
      'Season',
      'Series',
      'Trailer',
      'Video'
    ].includes(item.Type || '')
    || ['Video', 'Audio'].includes(item.MediaType || '')
    || item.IsFolder
  );
}
/**
 * Check if an item can be resumed
 */
export function canResume(item: BaseItemDto): boolean {
  return Boolean(item.UserData?.PlaybackPositionTicks && item.UserData.PlaybackPositionTicks > 0);
}
/**
 * Determine if an item can be mark as played
 *
 * @param item - Determines if an item can be marked as played
 * @returns Whether the item can be mark played or not
 */
export function canMarkWatched(item: BaseItemDto): boolean {
  if (
    ['Series', 'Season', 'BoxSet', 'AudioPodcast', 'AudioBook'].includes(
      item.Type || ''
    )
  ) {
    return true;
  }

  return !!(item.MediaType === 'Video' && item.Type !== 'TvChannel');
}

/**
 * Determine if an item can be instant mixed.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be instant mixed or not.
 */
export function canInstantMix(item: BaseItemDto): boolean {
  return ['Audio', 'MusicAlbum', 'MusicArtist', 'MusicGenre'].includes(
    item.Type || ''
  );
}

/**
 * Check if an item's metadata can be refreshed.
 */
export function canRefreshMetadata(item: BaseItemDto): boolean {
  const invalidRefreshType = ['Timer', 'SeriesTimer', 'Program', 'TvChannel'];

  if (item.CollectionType === 'livetv') {
    return false;
  }

  const incompleteRecording
    = item.Type === BaseItemKind.Recording && item.Status !== 'Completed';
  const IsAdministrator
    = remote.auth.currentUser?.Policy?.IsAdministrator ?? false;

  return (
    IsAdministrator
    && !incompleteRecording
    && !invalidRefreshType.includes(item.Type ?? '')
  );
}

/**
 * Generate a link to the item's details page route
 *
 * @param item - The item used to generate the route
 * @param overrideType - Force the type to use
 * @returns A valid route to the item's details page
 */
export function getItemDetailsLink(
  item: BaseItemDto | BaseItemPerson,
  overrideType?: BaseItemKind
): string {
  const itemId = String(item.Id);
  let routeName: keyof RouteNamedMap;

  if (!isPerson(item) && isLibrary(item)) {
    routeName = '/library/[itemId]';
  } else {
    const type = overrideType || item.Type;

    switch (type) {
      case 'Series': {
        routeName = '/series/[itemId]';
        break;
      }
      case 'Person': {
        routeName = '/person/[itemId]';
        break;
      }
      case 'MusicArtist': {
        routeName = '/artist/[itemId]';
        break;
      }
      case 'MusicAlbum': {
        routeName = '/musicalbum/[itemId]';
        break;
      }
      case 'Genre': {
        routeName = '/genre/[itemId]';
        break;
      }
      default: {
        routeName = '/item/[itemId]';
        break;
      }
    }
  }

  return router.resolve({
    name: routeName,
    params: { itemId }
  }).path;
}

/**
 * Returns the appropiate material design icon for the BaseItemDto provided
 *
 * @param item - The item we want to get the icon for
 * @returns - The string that references the icon
 */
export function getItemIcon(
  item: BaseItemDto | BaseItemPerson
): typeof IMdiAccount | undefined {
  let itemIcon;

  if (isPerson(item)) {
    itemIcon = IMdiAccount;
  } else {
    switch (item.Type) {
      case 'Audio': {
        itemIcon = IMdiMusicNote;
        break;
      }
      case 'AudioBook': {
        itemIcon = IMdiBookMusic;
        break;
      }
      case 'Book': {
        itemIcon = IMdiBookOpenPageVariant;
        break;
      }
      case 'BoxSet': {
        itemIcon = IMdiFolderMultiple;
        break;
      }
      case 'Folder':
      case 'CollectionFolder': {
        itemIcon = IMdiFolder;
        break;
      }
      case 'Movie': {
        itemIcon = IMdiFilmstrip;
        break;
      }
      case 'MusicAlbum': {
        itemIcon = IMdiAlbum;
        break;
      }
      case 'MusicArtist':
      case 'Person': {
        itemIcon = IMdiAccount;
        break;
      }
      case 'PhotoAlbum': {
        itemIcon = IMdiImageMultiple;
        break;
      }
      case 'Playlist': {
        itemIcon = IMdiPlaylistPlay;
        break;
      }
      case 'Series':
      case 'Episode': {
        itemIcon = IMdiTelevisionClassic;
        break;
      }
    }
  }

  return itemIcon;
}

/**
 * Get the runtime of an item in milliseconds
 */
export function getItemRuntime(item: BaseItemDto): number {
  return ticksToMs(item.RunTimeTicks);
}

/**
 * Filters the media streams based on the wanted type
 *
 * @param mediaStreams - Media streams to filter among
 * @param streamType - Stream type such as "audio" or "subtitles"
 * @returns - Filtered media streams
 */
export function getMediaStreams(
  mediaStreams: MediaStream[],
  streamType: string
): MediaStream[] {
  return mediaStreams.filter(mediaStream => mediaStream.Type === streamType);
}

/**
 * Get the item ID either from the item itself or from the MediaSource
 *
 * @param item - The item to get the ID from
 * @param sourceIndex - The index of the MediaSource to get the ID from (optional)
 * @returns The ID of the item or the MediaSource
 */
export function getItemIdFromSourceIndex(
  item: BaseItemDto,
  sourceIndex?: number
): string {
  if (sourceIndex === undefined) {
    return item.Id ?? '';
  }

  const mediaSource = item.MediaSources?.[sourceIndex];

  return (mediaSource ? mediaSource.Id : item.Id) ?? '';
}

/**
 * Create an item download object that contains the URL and filename.
 *
 * @returns - A download object.
 */
export function getItemDownloadUrl(itemId: string): string | undefined {
  const serverAddress = remote.sdk.api?.basePath;
  const userToken = remote.sdk.api?.accessToken;

  if (!serverAddress || !userToken) {
    return undefined;
  }

  return `${serverAddress}/Items/${itemId}/Download?api_key=${userToken}`;
}

/**
 * Get a map of an episode name and its download url, given a season.
 *
 * @returns - A map: [EpisodeName, DownloadUrl].
 */
export async function getItemSeasonDownloadMap(
  seasonId: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const episodes
    = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId,
        parentId: seasonId,
        fields: [ItemFields.Overview, ItemFields.CanDownload, ItemFields.Path]
      })
    ).data.Items ?? [];

  for (const episode of episodes) {
    if (episode.Id && !isNil(episode.Name)) {
      const url = getItemDownloadUrl(episode.Id);

      if (url) {
        result.set(episode.Name, url);
      }
    }
  }

  return result;
}

/**
 * Get a map of an episode name and its download url, given a series.
 *
 * @returns - A map: [EpisodeName, DownloadUrl].
 */
export async function getItemSeriesDownloadMap(
  seriesId: string
): Promise<Map<string, string>> {
  let result = new Map<string, string>();

  const seasons
    = (
      await remote.sdk.newUserApi(getTvShowsApi).getSeasons({
        userId: remote.auth.currentUserId,
        seriesId: seriesId
      })
    ).data.Items ?? [];

  for (const season of seasons) {
    if (season.Id) {
      const map = await getItemSeasonDownloadMap(season.Id);

      result = new Map([...result, ...map]);
    }
  }

  return result;
}

/**
 * Format a number of bytes into a human readable string
 *
 * @param size - The number of bytes to format
 * @returns - A human readable string
 */
export function formatFileSize(size: number): string {
  if (size === 0) {
    return '0 B';
  }

  const i = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, i)).toFixed(2)} ${
    ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB'][i]
  }`;
}

/**
 * Format an item's bitrate into an standard human-readable format
 * Eg: 18112.27 kbps
 */
export function formatBitRate(bitrate: number): string {
  return `${(bitrate / 1000).toFixed(2)} kbps`;
}

/**
 * Gets all the items that need to be resolved to populate the interface
 */
interface IndexPageQueries {
  views: ComputedRef<BaseItemDto[]>;
  resumeVideo: ComputedRef<BaseItemDto[]>;
  carousel: ComputedRef<BaseItemDto[]>;
  nextUp: ComputedRef<BaseItemDto[]>;
  latestPerLibrary: Map<BaseItemDto['Id'], ComputedRef<BaseItemDto[]>>;
}

/**
 * Fetches all the items that are needed to populate the default layout
 * (like libraries, which are necessary for the drawer).
 *
 * This is here so this function can be invoked from the login page as well,
 * so when it resolves all the content is already loaded without further delay.
 */
export async function fetchIndexPage(): Promise<IndexPageQueries> {
  const latestPerLibrary = new Map<BaseItemDto['Id'], ComputedRef<BaseItemDto[]>>();

  const { data: views } = await useBaseItem(getUserViewsApi, 'getUserViews')(() => ({}));

  const latestFromLibrary = async (): Promise<void> => {
    for (const view of views.value) {
      const { data } = await useBaseItem(getUserLibraryApi, 'getLatestMedia')(() => ({
        parentId: view.Id
      }));

      latestPerLibrary.set(view.Id, data);
    }
  };

  const promises = [
    useBaseItem(getItemsApi, 'getResumeItems')(() => ({
      mediaTypes: ['Video']
    })),
    useBaseItem(getUserLibraryApi, 'getLatestMedia')(() => ({})),
    useBaseItem(getTvShowsApi, 'getNextUp')(() => ({})),
    latestFromLibrary()
  ];

  const results = (await Promise.all(promises)).filter((r): r is Exclude<typeof r, void> => r !== undefined);

  return {
    views,
    resumeVideo: results[0].data,
    carousel: results[1].data,
    nextUp: results[2].data,
    latestPerLibrary
  };
}
