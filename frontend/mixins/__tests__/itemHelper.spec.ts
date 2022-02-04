import Vue from 'vue';
import itemHelper from '~/mixins/itemHelper';

const TestComponent = new Vue({
  mixins: [itemHelper]
});

describe('mixin: itemHelper', () => {
  it('returns true if the item can be played', () => {
    // TODO: Replace with BaseItemKind enum
    expect(TestComponent.canPlay({ Type: 'AggregateFolder' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Audio' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'AudioBook' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'BasePluginFolder' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Book' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'BoxSet' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Channel' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'ChannelFolderItem' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'CollectionFolder' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Episode' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Folder' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Genre' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'ManualPlaylistsFolder' })).toBe(
      false
    );
    expect(TestComponent.canPlay({ Type: 'Movie' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'MusicAlbum' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'MusicArtist' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'MusicGenre' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'MusicVideo' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Person' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Photo' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'PhotoAlbum' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Playlist' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Program' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Recording' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Season' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Series' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Studio' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Trailer' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'TvChannel' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'TvProgram' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'UserRootFolder' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'UserView' })).toBe(false);
    expect(TestComponent.canPlay({ Type: 'Video' })).toBe(true);
    expect(TestComponent.canPlay({ Type: 'Year' })).toBe(false);

    expect(TestComponent.canPlay({ MediaType: 'Video' })).toBe(true);
    expect(TestComponent.canPlay({ MediaType: 'Audio' })).toBe(true);

    expect(TestComponent.canPlay({})).toBe(false);
  });

  it('returns true if the item can be resumed', () => {
    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 1 } })
    ).toBe(true);

    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 0 } })
    ).toBe(false);

    expect(TestComponent.canResume({ UserData: {} })).toBe(false);
  });

  it('returns true if the item can be marked as watched', () => {
    expect(TestComponent.canMarkWatched({ Type: 'AggregateFolder' })).toBe(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Audio' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'AudioBook' })).toBe(true);
    expect(TestComponent.canMarkWatched({ Type: 'BasePluginFolder' })).toBe(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Book' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'BoxSet' })).toBe(true);
    expect(TestComponent.canMarkWatched({ Type: 'Channel' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'ChannelFolderItem' })).toBe(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'CollectionFolder' })).toBe(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Episode' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Folder' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Genre' })).toBe(false);
    expect(
      TestComponent.canMarkWatched({ Type: 'ManualPlaylistsFolder' })
    ).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Movie' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicAlbum' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicArtist' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicGenre' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicVideo' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Person' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Photo' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'PhotoAlbum' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Playlist' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Program' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Recording' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Season' })).toBe(true);
    expect(TestComponent.canMarkWatched({ Type: 'Series' })).toBe(true);
    expect(TestComponent.canMarkWatched({ Type: 'Studio' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Trailer' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'TvChannel' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'TvProgram' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'UserRootFolder' })).toBe(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'UserView' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Video' })).toBe(false);
    expect(TestComponent.canMarkWatched({ Type: 'Year' })).toBe(false);

    expect(TestComponent.canMarkWatched({ MediaType: 'Video' })).toBe(true);
    expect(TestComponent.canMarkWatched({ MediaType: 'Audio' })).toBe(false);

    expect(TestComponent.canMarkWatched({})).toBe(false);
  });
});
