import {
  getShapeFromCollectionType,
  getShapeFromItemType,
  getLibraryIcon,
  CardShapes,
  canPlay,
  canResume,
  canMarkWatched
} from '~/utils/items';

describe('getLibraryIcon', () => {
  it('returns the correct library icon based on library type', () => {
    expect(getLibraryIcon('movies')).toBe('mdi-movie');
    expect(getLibraryIcon('music')).toBe('mdi-music');
    expect(getLibraryIcon('photos')).toBe('mdi-image');
    expect(getLibraryIcon('livetv')).toBe('mdi-youtube-tv');
    expect(getLibraryIcon('tvshows')).toBe('mdi-television-classic');
    expect(getLibraryIcon('homevideos')).toBe('mdi-image-multiple');
    expect(getLibraryIcon('musicvideos')).toBe('mdi-music-box');
    expect(getLibraryIcon('books')).toBe('mdi-book-open-page-variant');
    expect(getLibraryIcon('channels')).toBe('mdi-youtube');
    expect(getLibraryIcon('playlists')).toBe('mdi-playlist-play');

    expect(getLibraryIcon(undefined)).toBe('mdi-folder');
    expect(getLibraryIcon(null)).toBe('mdi-folder');
  });
});

describe('getShapeFromCollectionType', () => {
  it('returns the correct card shape based on collection type', () => {
    expect(getShapeFromCollectionType('boxsets')).toEqual(CardShapes.Portrait);
    expect(getShapeFromCollectionType('movies')).toEqual(CardShapes.Portrait);
    expect(getShapeFromCollectionType('tvshows')).toEqual(CardShapes.Portrait);
    expect(getShapeFromCollectionType('books')).toEqual(CardShapes.Portrait);

    expect(getShapeFromCollectionType('livetv')).toEqual(CardShapes.Thumb);

    expect(getShapeFromCollectionType('folders')).toEqual(CardShapes.Square);
    expect(getShapeFromCollectionType('playlists')).toEqual(CardShapes.Square);
    expect(getShapeFromCollectionType('music')).toEqual(CardShapes.Square);
    expect(getShapeFromCollectionType(undefined)).toEqual(CardShapes.Portrait);
    expect(getShapeFromCollectionType(null)).toEqual(CardShapes.Portrait);
  });
});

describe('getShapeFromItemType', () => {
  it('returns the correct card shape based on item type', () => {
    expect(getShapeFromItemType('Audio')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('Folder')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('MusicAlbum')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('MusicArtist')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('MusicGenre')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('PhotoAlbum')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('Playlist')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('Video')).toEqual(CardShapes.Square);

    expect(getShapeFromItemType('Episode')).toEqual(CardShapes.Thumb);
    expect(getShapeFromItemType('Studio')).toEqual(CardShapes.Thumb);

    expect(getShapeFromItemType('Book')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('BoxSet')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('Genre')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('Movie')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('Person')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('Series')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType(undefined)).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType(null)).toEqual(CardShapes.Portrait);
  });
});

describe('Playback functions', () => {
  it('returns true if the item can be played', () => {
    // TODO: Replace with BaseItemKind enum
    expect(canPlay({ Type: 'AggregateFolder' })).toBe(false);
    expect(canPlay({ Type: 'Audio' })).toBe(true);
    expect(canPlay({ Type: 'AudioBook' })).toBe(true);
    expect(canPlay({ Type: 'BasePluginFolder' })).toBe(false);
    expect(canPlay({ Type: 'Book' })).toBe(false);
    expect(canPlay({ Type: 'BoxSet' })).toBe(true);
    expect(canPlay({ Type: 'Channel' })).toBe(false);
    expect(canPlay({ Type: 'ChannelFolderItem' })).toBe(false);
    expect(canPlay({ Type: 'CollectionFolder' })).toBe(false);
    expect(canPlay({ Type: 'Episode' })).toBe(true);
    expect(canPlay({ Type: 'Folder' })).toBe(false);
    expect(canPlay({ Type: 'Genre' })).toBe(false);
    expect(canPlay({ Type: 'ManualPlaylistsFolder' })).toBe(false);
    expect(canPlay({ Type: 'Movie' })).toBe(true);
    expect(canPlay({ Type: 'MusicAlbum' })).toBe(true);
    expect(canPlay({ Type: 'MusicArtist' })).toBe(true);
    expect(canPlay({ Type: 'MusicGenre' })).toBe(true);
    expect(canPlay({ Type: 'MusicVideo' })).toBe(true);
    expect(canPlay({ Type: 'Person' })).toBe(false);
    expect(canPlay({ Type: 'Photo' })).toBe(false);
    expect(canPlay({ Type: 'PhotoAlbum' })).toBe(false);
    expect(canPlay({ Type: 'Playlist' })).toBe(true);
    expect(canPlay({ Type: 'Program' })).toBe(false);
    expect(canPlay({ Type: 'Recording' })).toBe(false);
    expect(canPlay({ Type: 'Season' })).toBe(true);
    expect(canPlay({ Type: 'Series' })).toBe(true);
    expect(canPlay({ Type: 'Studio' })).toBe(false);
    expect(canPlay({ Type: 'Trailer' })).toBe(true);
    expect(canPlay({ Type: 'TvChannel' })).toBe(false);
    expect(canPlay({ Type: 'TvProgram' })).toBe(false);
    expect(canPlay({ Type: 'UserRootFolder' })).toBe(false);
    expect(canPlay({ Type: 'UserView' })).toBe(false);
    expect(canPlay({ Type: 'Video' })).toBe(true);
    expect(canPlay({ Type: 'Year' })).toBe(false);

    expect(canPlay({ MediaType: 'Video' })).toBe(true);
    expect(canPlay({ MediaType: 'Audio' })).toBe(true);

    expect(canPlay({})).toBe(false);
  });

  it('returns true if the item can be resumed', () => {
    expect(canResume({ UserData: { PlaybackPositionTicks: 1 } })).toBe(true);

    expect(canResume({ UserData: { PlaybackPositionTicks: 0 } })).toBe(false);

    expect(canResume({ UserData: {} })).toBe(false);
  });

  it('returns true if the item can be marked as watched', () => {
    expect(canMarkWatched({ Type: 'AggregateFolder' })).toBe(false);
    expect(canMarkWatched({ Type: 'Audio' })).toBe(false);
    expect(canMarkWatched({ Type: 'AudioBook' })).toBe(true);
    expect(canMarkWatched({ Type: 'BasePluginFolder' })).toBe(false);
    expect(canMarkWatched({ Type: 'Book' })).toBe(false);
    expect(canMarkWatched({ Type: 'BoxSet' })).toBe(true);
    expect(canMarkWatched({ Type: 'Channel' })).toBe(false);
    expect(canMarkWatched({ Type: 'ChannelFolderItem' })).toBe(false);
    expect(canMarkWatched({ Type: 'CollectionFolder' })).toBe(false);
    expect(canMarkWatched({ Type: 'Episode' })).toBe(false);
    expect(canMarkWatched({ Type: 'Folder' })).toBe(false);
    expect(canMarkWatched({ Type: 'Genre' })).toBe(false);
    expect(canMarkWatched({ Type: 'ManualPlaylistsFolder' })).toBe(false);
    expect(canMarkWatched({ Type: 'Movie' })).toBe(false);
    expect(canMarkWatched({ Type: 'MusicAlbum' })).toBe(false);
    expect(canMarkWatched({ Type: 'MusicArtist' })).toBe(false);
    expect(canMarkWatched({ Type: 'MusicGenre' })).toBe(false);
    expect(canMarkWatched({ Type: 'MusicVideo' })).toBe(false);
    expect(canMarkWatched({ Type: 'Person' })).toBe(false);
    expect(canMarkWatched({ Type: 'Photo' })).toBe(false);
    expect(canMarkWatched({ Type: 'PhotoAlbum' })).toBe(false);
    expect(canMarkWatched({ Type: 'Playlist' })).toBe(false);
    expect(canMarkWatched({ Type: 'Program' })).toBe(false);
    expect(canMarkWatched({ Type: 'Recording' })).toBe(false);
    expect(canMarkWatched({ Type: 'Season' })).toBe(true);
    expect(canMarkWatched({ Type: 'Series' })).toBe(true);
    expect(canMarkWatched({ Type: 'Studio' })).toBe(false);
    expect(canMarkWatched({ Type: 'Trailer' })).toBe(false);
    expect(canMarkWatched({ Type: 'TvChannel' })).toBe(false);
    expect(canMarkWatched({ Type: 'TvProgram' })).toBe(false);
    expect(canMarkWatched({ Type: 'UserRootFolder' })).toBe(false);
    expect(canMarkWatched({ Type: 'UserView' })).toBe(false);
    expect(canMarkWatched({ Type: 'Video' })).toBe(false);
    expect(canMarkWatched({ Type: 'Year' })).toBe(false);

    expect(canMarkWatched({ MediaType: 'Video' })).toBe(true);
    expect(canMarkWatched({ MediaType: 'Audio' })).toBe(false);

    expect(canMarkWatched({})).toBe(false);
  });
});
