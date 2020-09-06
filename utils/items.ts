export function getLibraryIcon(libraryType: string | undefined | null): string {
  switch (libraryType) {
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

export function getShapeFromCollectionType(
  collectionType: string | null | undefined
): string {
  switch (collectionType) {
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
