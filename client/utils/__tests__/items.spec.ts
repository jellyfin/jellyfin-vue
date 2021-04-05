import {
  getShapeFromCollectionType,
  getShapeFromItemType,
  getLibraryIcon
} from '~/utils/items';

describe('getLibraryIcon', () => {
  it('returns the correct library icon based on library type', () => {
    expect(getLibraryIcon('movies')).toEqual('mdi-movie');
    expect(getLibraryIcon('music')).toEqual('mdi-music');
    expect(getLibraryIcon('photos')).toEqual('mdi-image');
    expect(getLibraryIcon('livetv')).toEqual('mdi-youtube-tv');
    expect(getLibraryIcon('tvshows')).toEqual('mdi-television-classic');
    expect(getLibraryIcon('homevideos')).toEqual('mdi-image-multiple');
    expect(getLibraryIcon('musicvideos')).toEqual('mdi-music-box');
    expect(getLibraryIcon('books')).toEqual('mdi-book-open-page-variant');
    expect(getLibraryIcon('channels')).toEqual('mdi-youtube');
    expect(getLibraryIcon('playlists')).toEqual('mdi-playlist-play');

    expect(getLibraryIcon(undefined)).toEqual('mdi-folder');
    expect(getLibraryIcon(null)).toEqual('mdi-folder');
  });
});

describe('getShapeFromCollectionType', () => {
  it('returns the correct card shape based on collection type', () => {
    expect(getShapeFromCollectionType('boxsets')).toEqual('portrait-card');
    expect(getShapeFromCollectionType('movies')).toEqual('portrait-card');
    expect(getShapeFromCollectionType('tvshows')).toEqual('portrait-card');
    expect(getShapeFromCollectionType('books')).toEqual('portrait-card');

    expect(getShapeFromCollectionType('livetv')).toEqual('thumb-card');

    expect(getShapeFromCollectionType('folders')).toEqual('square-card');
    expect(getShapeFromCollectionType('playlists')).toEqual('square-card');
    expect(getShapeFromCollectionType('music')).toEqual('square-card');
    expect(getShapeFromCollectionType(undefined)).toEqual('portrait-card');
    expect(getShapeFromCollectionType(null)).toEqual('portrait-card');
  });
});

describe('getShapeFromItemType', () => {
  it('returns the correct card shape based on item type', () => {
    expect(getShapeFromItemType('Audio')).toEqual('square-card');
    expect(getShapeFromItemType('folder')).toEqual('square-card');
    expect(getShapeFromItemType('musicalbum')).toEqual('square-card');
    expect(getShapeFromItemType('musicartist')).toEqual('square-card');
    expect(getShapeFromItemType('musicgenre')).toEqual('square-card');
    expect(getShapeFromItemType('photoalbum')).toEqual('square-card');
    expect(getShapeFromItemType('playlist')).toEqual('square-card');
    expect(getShapeFromItemType('video')).toEqual('square-card');

    expect(getShapeFromItemType('Episode')).toEqual('thumb-card');
    expect(getShapeFromItemType('Studio')).toEqual('thumb-card');

    expect(getShapeFromItemType('Book')).toEqual('portrait-card');
    expect(getShapeFromItemType('boxSet')).toEqual('portrait-card');
    expect(getShapeFromItemType('genre')).toEqual('portrait-card');
    expect(getShapeFromItemType('movie')).toEqual('portrait-card');
    expect(getShapeFromItemType('person')).toEqual('portrait-card');
    expect(getShapeFromItemType('series')).toEqual('portrait-card');
    expect(getShapeFromItemType(undefined)).toEqual('portrait-card');
    expect(getShapeFromItemType(null)).toEqual('portrait-card');
  });
});
