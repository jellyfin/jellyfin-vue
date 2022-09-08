/**
 * Item and playback helpers
 */
import {
  BaseItemDto,
  BaseItemPerson,
  MediaStream
} from '@jellyfin/client-axios';

/**
 * A list of valid collections that should be treated as folders.
 */
export const validLibraryTypes = [
  'CollectionFolder',
  'Folder',
  'UserView',
  'playlists',
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

export type ValidCardShapes =
  | CardShapes.Portrait
  | CardShapes.Thumb
  | CardShapes.Square
  | CardShapes.Banner;

/**
 * Determines if the item is a person
 *
 * @param {*} item - The item to be checked.
 * @returns {boolean} Whether the provided item is of type BaseItemPerson.
 */
export function isPerson(
  item: BaseItemDto | BaseItemPerson
): item is BaseItemPerson {
  if (
    'Role' in (item as BaseItemPerson) ||
    (item.Type && validPersonTypes.includes(item.Type))
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the string is a valid MD5 hash.
 *
 * @param {string} input - The string to check for validity
 * @returns {boolean} - A boolean representing the validity of the input string
 */
export function isValidMD5(input: string): boolean {
  return /[a-fA-F0-9]{32}/.test(input);
}

/**
 * Get the Material Design Icon name associated with a type of library
 *
 * @param {(string | undefined | null)} libraryType - Type of the library
 * @returns {string} Name of the Material Design Icon associated with the type
 */
export function getLibraryIcon(libraryType: string | undefined | null): string {
  switch (libraryType?.toLowerCase()) {
    case 'movies':
      return 'mdi-movie';
    case 'music':
      return 'mdi-music';
    case 'photos':
      return 'mdi-image';
    case 'livetv':
      return 'mdi-youtube-tv';
    case 'tvshows':
      return 'mdi-television-classic';
    case 'homevideos':
      return 'mdi-image-multiple';
    case 'musicvideos':
      return 'mdi-music-box';
    case 'books':
      return 'mdi-book-open-page-variant';
    case 'channels':
      return 'mdi-youtube';
    case 'playlists':
      return 'mdi-playlist-play';
    default:
      return 'mdi-folder';
  }
}

/**
 * Get the card shape associated with a collection type
 *
 * @param {(string | null | undefined)} collectionType - Type of the collection
 * @returns {string} CSS class to use as the shape of the card
 */
export function getShapeFromCollectionType(
  collectionType: string | null | undefined
): ValidCardShapes {
  switch (collectionType?.toLowerCase()) {
    case 'livetv':
    case 'musicvideos':
      return CardShapes.Thumb;
    case 'folders':
    case 'playlists':
    case 'music':
      return CardShapes.Square;
    case 'boxsets':
    case 'movies':
    case 'tvshows':
    case 'books':
    default:
      return CardShapes.Portrait;
  }
}

/**
 * Gets the card shape associated with a collection type
 *
 * @param {(string | null | undefined)} itemType - type of item
 * @returns {string} CSS class to use as the shape of the card
 */
export function getShapeFromItemType(
  itemType: string | null | undefined
): ValidCardShapes {
  // TODO: Refactor to take a BaseItemDto or BaseItemPerson instead
  switch (itemType?.toLowerCase()) {
    case 'audio':
    case 'folder':
    case 'musicalbum':
    case 'musicartist':
    case 'musicgenre':
    case 'photoalbum':
    case 'playlist':
    case 'video':
      return CardShapes.Square;
    case 'episode':
    case 'musicvideo':
    case 'studio':
      return CardShapes.Thumb;
    case 'book':
    case 'boxSet':
    case 'genre':
    case 'movie':
    case 'person':
    case 'series':
    default:
      return CardShapes.Portrait;
  }
}

/**
 * Test if the passed item can be played by one of the players in the client.
 *
 * @param {BaseItemDto} item - The item to be tested for playback support
 * @returns {boolean} Whether the item can be played on this client or not
 */
export function canPlay(item: BaseItemDto | undefined): boolean {
  if (item === undefined) {
    return false;
  }

  if (
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
  ) {
    return true;
  }

  return false;
}
export function canResume(item: BaseItemDto): boolean {
  if (
    item?.UserData?.PlaybackPositionTicks &&
    item.UserData.PlaybackPositionTicks > 0
  ) {
    return true;
  } else {
    return false;
  }
}
/**
 * Determine if an item can be mark as played
 *
 * @param {BaseItemDto} item - Determines if an item can be marked as played
 * @returns {boolean} Whether the item can be mark played or not
 */
export function canMarkWatched(item: BaseItemDto): boolean {
  if (
    ['Series', 'Season', 'BoxSet', 'AudioPodcast', 'AudioBook'].includes(
      item.Type || ''
    )
  ) {
    return true;
  }

  if (item.MediaType === 'Video' && item.Type !== 'TvChannel') {
    return true;
  }

  return false;
}
/**
 * Generate a link to the item's details page route
 *
 * @param {BaseItemDto} item - The item used to generate the route
 * @param {string} overrideType - Force the type to use
 * @returns {string} A valid route to the item's details page
 */
export function getItemDetailsLink(
  item: BaseItemDto,
  overrideType?: string
): string {
  let routeName: string;
  let routeParams: Record<never, never>;

  if (item.Type && validLibraryTypes.includes(item.Type)) {
    routeName = 'library-viewId';
    routeParams = { viewId: item.Id };
  } else {
    const type = overrideType || item.Type;

    switch (type) {
      case 'Series':
        routeName = 'series-itemId';
        routeParams = { itemId: item.Id };
        break;
      case 'Person':
        routeName = 'person-itemId';
        routeParams = { itemId: item.Id };
        break;
      case 'MusicArtist':
        routeName = 'artist-itemId';
        routeParams = { itemId: item.Id };
        break;
      case 'MusicAlbum':
        routeName = 'musicalbum-itemId';
        routeParams = { itemId: item.Id };
        break;
      case 'Genre':
        routeName = 'genre-itemId';
        routeParams = { itemId: item.Id };
        break;
      default:
        routeName = 'item-itemId';
        routeParams = { itemId: item.Id };
        break;
    }
  }

  return window.$nuxt.$router.resolve({
    name: routeName,
    params: routeParams
  }).resolved.path;
}
/**
 * Returns the appropiate material design icon for the BaseItemDto provided
 *
 * @param {BaseItemDto | BaseItemPerson} item - The item we want to get the icon for
 * @returns {string} - The string that references the icon
 */
export function getItemIcon(item: BaseItemDto | BaseItemPerson): string {
  let itemIcon = '';

  if (isPerson(item)) {
    itemIcon = 'mdi-account';
  } else {
    switch (item.Type) {
      case 'Audio':
        itemIcon = 'mdi-music-note';
        break;
      case 'AudioBook':
        itemIcon = 'mdi-book-music';
        break;
      case 'Book':
        itemIcon = 'mdi-book-open-page-variant';
        break;
      case 'BoxSet':
        itemIcon = 'mdi-folder-multiple';
        break;
      case 'Folder':
      case 'CollectionFolder':
        itemIcon = 'mdi-folder';
        break;
      case 'Movie':
        itemIcon = 'mdi-filmstrip';
        break;
      case 'MusicAlbum':
        itemIcon = 'mdi-album';
        break;
      case 'MusicArtist':
      case 'Person':
        itemIcon = 'mdi-account';
        break;
      case 'PhotoAlbum':
        itemIcon = 'mdi-image-multiple';
        break;
      case 'Playlist':
        itemIcon = 'mdi-playlist-play';
        break;
      case 'Series':
      case 'Episode':
        itemIcon = 'mdi-television-classic';
        break;
    }
  }

  return itemIcon;
}
/**
 * Filters the media streams based on the wanted type
 *
 * @param {MediaStream[]} mediaStreams - Media streams to filter among
 * @param {string} streamType - Stream type such as "audio" or "subtitles"
 * @returns {MediaStream[]} - Filtered media streams
 */
export function getMediaStreams(
  mediaStreams: MediaStream[],
  streamType: string
): MediaStream[] {
  return mediaStreams.filter((mediaStream) => mediaStream.Type === streamType);
}
