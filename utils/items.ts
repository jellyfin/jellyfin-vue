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
): string {
  switch (collectionType?.toLowerCase()) {
    case 'boxsets':
    case 'movies':
    case 'tvshows':
    case 'books':
      return 'portrait-card';
    case 'livetv':
      return 'thumb-card';
    case 'folders':
    case 'playlists':
    case 'music':
    default:
      return 'square-card';
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
): string {
  switch (itemType?.toLowerCase()) {
    case 'audio':
    case 'folder':
    case 'musicalbum':
    case 'musicartist':
    case 'musicgenre':
    case 'photoalbum':
    case 'playlist':
    case 'video':
      return 'square-card';
    case 'episode':
    case 'studio':
      return 'thumb-card';
    case 'book':
    case 'boxSet':
    case 'genre':
    case 'movie':
    case 'person':
    case 'series':
    default:
      return 'portrait-card';
  }
}
