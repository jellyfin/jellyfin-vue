import Vue from 'vue';
import itemHelper from '~/mixins/itemHelper.ts';

const TestComponent = new Vue({
  mixins: [itemHelper]
});

describe('itemHelper', () => {
  it('returns true if the item can be played', () => {
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

  it('returns the correct item icon', () => {
    expect(TestComponent.getItemIcon({ Type: 'AggregateFolder' })).toEqual(
      'mdi-folder'
    );
    expect(TestComponent.getItemIcon({ Type: 'Audio' })).toEqual(
      'mdi-music-note'
    );
    expect(TestComponent.getItemIcon({ Type: 'AudioBook' })).toEqual(
      'mdi-music-note'
    );
    expect(TestComponent.getItemIcon({ Type: 'BasePluginFolder' })).toEqual(
      'mdi-folder'
    );
    expect(TestComponent.getItemIcon({ Type: 'Book' })).toEqual(
      'mdi-book-open-page-variant'
    );
    expect(TestComponent.getItemIcon({ Type: 'BoxSet' })).toEqual(
      'mdi-folder-multiple'
    );
    expect(TestComponent.getItemIcon({ Type: 'Channel' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'ChannelFolderItem' })).toEqual(
      ''
    );
    expect(TestComponent.getItemIcon({ Type: 'CollectionFolder' })).toEqual(
      'mdi-folder'
    );
    expect(TestComponent.getItemIcon({ Type: 'Episode' })).toEqual(
      'mdi-television-classic'
    );
    expect(TestComponent.getItemIcon({ Type: 'Folder' })).toEqual('mdi-folder');
    expect(TestComponent.getItemIcon({ Type: 'Genre' })).toEqual('');
    expect(
      TestComponent.getItemIcon({ Type: 'ManualPlaylistsFolder' })
    ).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Movie' })).toEqual(
      'mdi-filmstrip'
    );
    expect(TestComponent.getItemIcon({ Type: 'MusicAlbum' })).toEqual(
      'mdi-album'
    );
    expect(TestComponent.getItemIcon({ Type: 'MusicArtist' })).toEqual(
      'mdi-account'
    );
    expect(TestComponent.getItemIcon({ Type: 'MusicGenre' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'MusicVideo' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Person' })).toEqual(
      'mdi-account'
    );
    expect(TestComponent.getItemIcon({ Type: 'Photo' })).toEqual('mdi-image');
    expect(TestComponent.getItemIcon({ Type: 'PhotoAlbum' })).toEqual(
      'mdi-image-multiple'
    );
    expect(TestComponent.getItemIcon({ Type: 'Playlist' })).toEqual(
      'mdi-playlist-play'
    );
    expect(TestComponent.getItemIcon({ Type: 'Program' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Recording' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Season' })).toEqual(
      'mdi-television-classic'
    );
    expect(TestComponent.getItemIcon({ Type: 'Series' })).toEqual(
      'mdi-television-classic'
    );
    expect(TestComponent.getItemIcon({ Type: 'Studio' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Trailer' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'TvChannel' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'TvProgram' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'UserRootFolder' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'UserView' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Video' })).toEqual('');
    expect(TestComponent.getItemIcon({ Type: 'Year' })).toEqual('');
  });
});
