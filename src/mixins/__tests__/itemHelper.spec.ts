import Vue from 'vue';
import itemHelper from '~/mixins/itemHelper';

const TestComponent = new Vue({
  mixins: [itemHelper]
});

describe('mixin: itemHelper', () => {
  it('returns true if the item can be played', () => {
    // TODO: Replace with BaseItemKind enum
    expect(TestComponent.canPlay({ Type: 'AggregateFolder' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Audio' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'AudioBook' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'BasePluginFolder' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Book' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'BoxSet' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Channel' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'ChannelFolderItem' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'CollectionFolder' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Episode' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Folder' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Genre' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'ManualPlaylistsFolder' })).toEqual(
      false
    );
    expect(TestComponent.canPlay({ Type: 'Movie' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicAlbum' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicArtist' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicGenre' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicVideo' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Person' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Photo' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'PhotoAlbum' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Playlist' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Program' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Recording' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Season' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Series' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Studio' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Trailer' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'TvChannel' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'TvProgram' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'UserRootFolder' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'UserView' })).toEqual(false);
    expect(TestComponent.canPlay({ Type: 'Video' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Year' })).toEqual(false);

    expect(TestComponent.canPlay({ MediaType: 'Video' })).toEqual(true);
    expect(TestComponent.canPlay({ MediaType: 'Audio' })).toEqual(true);

    expect(TestComponent.canPlay({})).toEqual(false);
  });

  it('returns true if the item can be resumed', () => {
    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 1 } })
    ).toEqual(true);

    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 0 } })
    ).toEqual(false);

    expect(TestComponent.canResume({ UserData: {} })).toEqual(false);
  });

  it('returns true if the item can be marked as watched', () => {
    expect(TestComponent.canMarkWatched({ Type: 'AggregateFolder' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Audio' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'AudioBook' })).toEqual(true);
    expect(TestComponent.canMarkWatched({ Type: 'BasePluginFolder' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Book' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'BoxSet' })).toEqual(true);
    expect(TestComponent.canMarkWatched({ Type: 'Channel' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'ChannelFolderItem' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'CollectionFolder' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'Episode' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Folder' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Genre' })).toEqual(false);
    expect(
      TestComponent.canMarkWatched({ Type: 'ManualPlaylistsFolder' })
    ).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Movie' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicAlbum' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicArtist' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'MusicGenre' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'MusicVideo' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Person' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Photo' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'PhotoAlbum' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Playlist' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Program' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Recording' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Season' })).toEqual(true);
    expect(TestComponent.canMarkWatched({ Type: 'Series' })).toEqual(true);
    expect(TestComponent.canMarkWatched({ Type: 'Studio' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Trailer' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'TvChannel' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'TvProgram' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'UserRootFolder' })).toEqual(
      false
    );
    expect(TestComponent.canMarkWatched({ Type: 'UserView' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Video' })).toEqual(false);
    expect(TestComponent.canMarkWatched({ Type: 'Year' })).toEqual(false);

    expect(TestComponent.canMarkWatched({ MediaType: 'Video' })).toEqual(true);
    expect(TestComponent.canMarkWatched({ MediaType: 'Audio' })).toEqual(false);

    expect(TestComponent.canMarkWatched({})).toEqual(false);
  });
});
