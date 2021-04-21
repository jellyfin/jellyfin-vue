import {
  getShapeFromCollectionType,
  getShapeFromItemType,
  getLibraryIcon,
  CardShapes
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
    expect(getShapeFromCollectionType('boxsets')).toEqual(CardShapes.portrait);
    expect(getShapeFromCollectionType('movies')).toEqual(CardShapes.portrait);
    expect(getShapeFromCollectionType('tvshows')).toEqual(CardShapes.portrait);
    expect(getShapeFromCollectionType('books')).toEqual(CardShapes.portrait);

    expect(getShapeFromCollectionType('livetv')).toEqual(CardShapes.thumb);

    expect(getShapeFromCollectionType('folders')).toEqual(CardShapes.square);
    expect(getShapeFromCollectionType('playlists')).toEqual(CardShapes.square);
    expect(getShapeFromCollectionType('music')).toEqual(CardShapes.square);
    expect(getShapeFromCollectionType(undefined)).toEqual(CardShapes.portrait);
    expect(getShapeFromCollectionType(null)).toEqual(CardShapes.portrait);
  });
});

describe('getShapeFromItemType', () => {
  it('returns the correct card shape based on item type', () => {
    expect(getShapeFromItemType('Audio')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('folder')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('musicalbum')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('musicartist')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('musicgenre')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('photoalbum')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('playlist')).toEqual(CardShapes.square);
    expect(getShapeFromItemType('video')).toEqual(CardShapes.square);

    expect(getShapeFromItemType('Episode')).toEqual(CardShapes.thumb);
    expect(getShapeFromItemType('Studio')).toEqual(CardShapes.thumb);

    expect(getShapeFromItemType('Book')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType('boxSet')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType('genre')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType('movie')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType('person')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType('series')).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType(undefined)).toEqual(CardShapes.portrait);
    expect(getShapeFromItemType(null)).toEqual(CardShapes.portrait);
  });
});
