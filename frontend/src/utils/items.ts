/**
 * Item and playback helpers
 */
import {
  BaseItemDto,
  BaseItemKind,
  BaseItemPerson,
  ItemFields,
  MediaStream,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';
import { useRouter } from 'vue-router';
import type { RouteNamedMap } from 'vue-router/auto/routes';
import IMdiMovie from 'virtual:icons/mdi/movie';
import IMdiMusic from 'virtual:icons/mdi/music';
import IMdiImage from 'virtual:icons/mdi/image';
import IMdiYoutubeTV from 'virtual:icons/mdi/youtube-tv';
import IMdiTelevisionClassic from 'virtual:icons/mdi/television-classic';
import IMdiImageMultiple from 'virtual:icons/mdi/image-multiple';
import IMdiMusicBox from 'virtual:icons/mdi/music-box';
import IMdiBookOpenPageVariant from 'virtual:icons/mdi/book-open-page-variant';
import IMdiYoutube from 'virtual:icons/mdi/youtube';
import IMdiPlaylistPlay from 'virtual:icons/mdi/playlist-play';
import IMdiFolder from 'virtual:icons/mdi/folder';
import IMdiAccount from 'virtual:icons/mdi/account';
import IMdiMusicNote from 'virtual:icons/mdi/music-note';
import IMdiBookMusic from 'virtual:icons/mdi/book-music';
import IMdiFolderMultiple from 'virtual:icons/mdi/folder-multiple';
import IMdiFilmstrip from 'virtual:icons/mdi/filmstrip';
import IMdiAlbum from 'virtual:icons/mdi/album';
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api/item-lookup-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { DownloadableFile } from './file-download';
import { useRemote } from '@/composables';

export interface IdentifySearchItem {
  key: string;
  value?: string | number;
  title: string;
  type: string;
}

/**
 * A list of valid collections that should be treated as folders.
 */
export const validLibraryTypes: string[] = [
  'CollectionFolder',
  'Folder',
  'UserView',
  'Playlist',
  'PhotoAlbum'
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
 * Determines if the item is a person
 *
 * @param item - The item to be checked.
 * @returns Whether the provided item is of type BaseItemPerson.
 */
export function isPerson(
  item: BaseItemDto | BaseItemPerson
): item is BaseItemPerson {
  return !!(
    'Role' in item ||
    (item.Type && validPersonTypes.includes(item.Type))
  );
}

/**
 * Checks if the string is a valid MD5 hash.
 *
 * @param input - The string to check for validity
 * @returns - A boolean representing the validity of the input string
 */
export function isValidMD5(input: string): boolean {
  return /[\dA-Fa-f]{32}/.test(input);
}

/**
 * Checks if an item is a local item.
 *
 * @param item - The item to be checked.
 * @returns - A boolean representing whether the item is a local item
 */
export function isLocalItem(item: BaseItemDto): boolean {
  return item?.Id?.indexOf('local') === 0;
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
 * Get the Material Design Icon name associated with a type of library
 *
 * @param libraryType - Type of the library
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
 * @param collectionType - Type of the collection
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
 * @param itemType - type of item
 * @returns CSS class to use as the shape of the card
 */
export function getShapeFromItemType(
  itemType: BaseItemKind | null | undefined
): CardShapes {
  if (!itemType) {
    return CardShapes.Portrait;
  }

  switch (itemType) {
    case 'Audio':
    case 'Folder':
    case 'MusicAlbum':
    case 'MusicArtist':
    case 'MusicGenre':
    case 'PhotoAlbum':
    case 'Playlist':
    case 'Video': {
      return CardShapes.Square;
    }
    case 'Episode':
    case 'MusicVideo':
    case 'Studio': {
      return CardShapes.Thumb;
    }
    default: {
      return CardShapes.Portrait;
    }
  }
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
    ].includes(item.Type || '') ||
    ['Video', 'Audio'].includes(item.MediaType || '') ||
    item.IsFolder
  );
}
/**
 * Check if an item can be resumed
 */
export function canResume(item: BaseItemDto): boolean {
  return item?.UserData?.PlaybackPositionTicks &&
    item.UserData.PlaybackPositionTicks > 0
    ? true
    : false;
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
 * Determine if an item can be identified.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be identified or not.
 */
export function canIdentify(item: BaseItemDto): boolean {
  const valid: BaseItemKind[] = [
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

  return (
    valid.includes((item.Type as BaseItemKind) || '') && !isLocalItem(item)
  );
}

/**
 * Determine if an item can be instant mixed.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be instant mixed or not.
 */
export function canInstantMix(item: BaseItemDto): boolean {
  return (
    ['Audio', 'MusicAlbum', 'MusicArtist', 'MusicGenre'].includes(
      item.Type || ''
    ) && !isLocalItem(item)
  );
}

/**
 * Determine if an item can be added to a playlist.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be added to a playlist or not.
 */
export function canBeAddedToPlaylist(item: BaseItemDto): boolean {
  if (item.CollectionType === 'livetv') {
    return false;
  }

  if (item.Type === 'Recording' && item.Status !== 'Completed') {
    return false;
  }

  if (item.MediaType === 'Photo') {
    return false;
  }

  const validItems = ['Genre', 'MusicGenre', 'MusicArtist'];

  return (
    !isLocalItem(item) &&
    (Boolean(item.MediaType) ||
      (item.IsFolder ?? false) ||
      validItems.includes(item.Type || ''))
  );
}

/**
 * Determine if an item can be added to a collection.
 *
 * @param item - The item to be checked.
 * @returns Whether the item can be added to a collection or not.
 */
export function canBeAddedToCollection(item: BaseItemDto): boolean {
  const invalidTypes = [
    'Genre',
    'MusicGenre',
    'Studio',
    'UserView',
    'CollectionFolder',
    'Audio',
    'Program',
    'Timer',
    'SeriesTimer'
  ];

  if (item.Type === 'Recording' && item.Status !== 'Completed') {
    return false;
  }

  return (
    !item.CollectionType &&
    !isLocalItem(item) &&
    item.MediaType !== 'Photo' &&
    !invalidTypes.includes(item.Type || '')
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
  const router = useRouter();
  let routeName: keyof RouteNamedMap;
  let routeParameters: Record<never, never>;

  if (item.Type && validLibraryTypes.includes(item.Type)) {
    routeName = 'library-itemId';
    routeParameters = { itemId: item.Id };
  } else {
    const type = overrideType || item.Type;

    switch (type) {
      case 'Series': {
        routeName = 'series-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
      case 'Person': {
        routeName = 'person-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
      case 'MusicArtist': {
        routeName = 'artist-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
      case 'MusicAlbum': {
        routeName = 'musicalbum-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
      case 'Genre': {
        routeName = 'genre-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
      default: {
        routeName = 'item-itemId';
        routeParameters = { itemId: item.Id };
        break;
      }
    }
  }

  return router.resolve({
    name: routeName,
    params: routeParameters
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
  return mediaStreams.filter((mediaStream) => mediaStream.Type === streamType);
}

/**
 * Create an item download object that contains the URL and filename.
 *
 * @param itemId - The item ID.
 * @param itemPath - The item path.
 * @returns - A download object.
 */
export function getItemDownloadObject(
  itemId: string,
  itemPath?: string
): DownloadableFile | undefined {
  const remote = useRemote();

  const serverAddress = remote.sdk.api?.basePath;
  const userToken = remote.sdk.api?.accessToken;

  if (!serverAddress || !userToken) {
    return undefined;
  }

  const fileName = itemPath?.includes('\\')
    ? itemPath?.split('\\').pop()
    : itemPath?.split('/').pop();

  return {
    url: `${serverAddress}/Items/${itemId}/Download?api_key=${userToken}`,
    fileName: fileName || ''
  };
}

/**
 * Get multiple download object for seasons.
 *
 * @param seasonId - The season ID.
 * @returns - An array of download objects.
 */
export async function getItemSeasonDownloadObjects(
  seasonId: string
): Promise<DownloadableFile[]> {
  const remote = useRemote();

  if (remote.sdk.api === undefined) {
    return [];
  }

  const episodes = (
    await remote.sdk.newUserApi(getItemsApi).getItems({
      userId: remote.auth.currentUserId,
      parentId: seasonId,
      fields: [ItemFields.Overview, ItemFields.CanDownload, ItemFields.Path]
    })
  ).data;

  return (
    episodes.Items?.map((r) => {
      if (r.Id && r.Path) {
        return getItemDownloadObject(r.Id, r.Path);
      }
    }).filter(
      (r): r is DownloadableFile =>
        r !== undefined && r.url.length > 0 && r.fileName.length > 0
    ) ?? []
  );
}

/**
 * Get download object for a series.
 * This will fetch every season for all the episodes.
 *
 * @param seriesId - The series ID.
 * @returns - An array of download objects.
 */
export async function getItemSeriesDownloadObjects(
  seriesId: string
): Promise<DownloadableFile[]> {
  const remote = useRemote();

  let mergedStreamURLs: DownloadableFile[] = [];

  if (remote.sdk.api === undefined) {
    return [];
  }

  const seasons = (
    await remote.sdk.newUserApi(getTvShowsApi).getSeasons({
      userId: remote.auth.currentUserId,
      seriesId: seriesId
    })
  ).data;

  for (const season of seasons.Items || []) {
    const seasonURLs = await getItemSeasonDownloadObjects(season.Id || '');

    mergedStreamURLs = [...mergedStreamURLs, ...seasonURLs];
  }

  return mergedStreamURLs;
}

interface SearchBuilder {
  Name?: string;
  Year?: number;
  ProviderIds: {
    [key: string]: string;
  };
}

/**
 * Get the remote search results for an item and search params.
 *
 * @param item - The item to search for.
 * @param searches - The search params to use.
 * @returns - An array of remote search results.
 */
export async function getItemRemoteSearch(
  item: BaseItemDto,
  searches: IdentifySearchItem[]
): Promise<RemoteSearchResult[] | undefined> {
  const remote = useRemote();

  const itemId = item.Id;

  if (remote.sdk.api === undefined) {
    return;
  }

  if (itemId === undefined) {
    return;
  }

  // Split the query to `search-item-` and the rest to provider IDs.

  const queryProviderIDs = searches
    .map((search) => {
      if (!search.key.startsWith('search-item-')) {
        return search;
      }
    })
    .filter((s): s is IdentifySearchItem => s !== undefined);
  const nameSearch = searches.find(
    (search) => search.key === 'search-item-Name'
  );
  const yearSearch = searches.find(
    (search) => search.key === 'search-item-Year'
  );

  const buildSearch: SearchBuilder = {
    ProviderIds: {}
  };

  if (nameSearch && nameSearch.value) {
    buildSearch.Name = nameSearch.value as string;
  }

  if (yearSearch && yearSearch.value) {
    buildSearch.Year = yearSearch.value as number;
  }

  for (const search of queryProviderIDs) {
    buildSearch.ProviderIds[search.key] = (search.value as string) || '';
  }

  const searcher = remote.sdk.newUserApi(getItemLookupApi);

  switch (item.Type) {
    case 'Book': {
      return (
        await searcher.getBookRemoteSearchResults({
          bookInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'BoxSet': {
      return (
        await searcher.getBoxSetRemoteSearchResults({
          boxSetInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'Movie': {
      return (
        await searcher.getMovieRemoteSearchResults({
          movieInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'MusicAlbum': {
      return (
        await searcher.getMusicAlbumRemoteSearchResults({
          albumInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'MusicArtist': {
      return (
        await searcher.getMusicArtistRemoteSearchResults({
          artistInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'MusicVideo': {
      return (
        await searcher.getMusicVideoRemoteSearchResults({
          musicVideoInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'Person': {
      return (
        await searcher.getPersonRemoteSearchResults({
          personLookupInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'Series': {
      return (
        await searcher.getSeriesRemoteSearchResults({
          seriesInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
    case 'Trailer': {
      return (
        await searcher.getTrailerRemoteSearchResults({
          trailerInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: buildSearch
          }
        })
      ).data;
    }
  }
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
