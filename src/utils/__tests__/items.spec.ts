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
    expect(getShapeFromItemType('folder')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('musicalbum')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('musicartist')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('musicgenre')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('photoalbum')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('playlist')).toEqual(CardShapes.Square);
    expect(getShapeFromItemType('video')).toEqual(CardShapes.Square);

    expect(getShapeFromItemType('Episode')).toEqual(CardShapes.Thumb);
    expect(getShapeFromItemType('Studio')).toEqual(CardShapes.Thumb);

    expect(getShapeFromItemType('Book')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('boxSet')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('genre')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('movie')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('person')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType('series')).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType(undefined)).toEqual(CardShapes.Portrait);
    expect(getShapeFromItemType(null)).toEqual(CardShapes.Portrait);
  });
});
