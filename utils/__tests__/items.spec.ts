import {
  getShapeFromCollectionType,
  getShapeFromItemType,
  getLibraryIcon
} from '../items';

describe('getLibraryIcon', () => {
  test('Returns correct library icon based on library type', () => {
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
  test('Returns correct card shape based on collection type', () => {
    expect(getShapeFromCollectionType('boxsets')).toEqual('portrait-card');
    expect(getShapeFromCollectionType('livetv')).toEqual('thumb-card');
    expect(getShapeFromCollectionType('folders')).toEqual('square-card');

    expect(getShapeFromCollectionType(undefined)).toEqual('square-card');
    expect(getShapeFromCollectionType(null)).toEqual('square-card');
  });
});

describe('getShapeFromItemType', () => {
  test('Returns correct card shape based on item type', () => {
    expect(getShapeFromItemType('Audio')).toEqual('square-card');
    expect(getShapeFromItemType('Episode')).toEqual('thumb-card');
    expect(getShapeFromItemType('Book')).toEqual('portrait-card');

    expect(getShapeFromItemType(undefined)).toEqual('portrait-card');
    expect(getShapeFromItemType(null)).toEqual('portrait-card');
  });
});
