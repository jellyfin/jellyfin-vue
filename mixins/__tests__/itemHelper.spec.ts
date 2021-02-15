import Vue from 'vue';
import itemHelper from '~/mixins/itemHelper.ts';

const TestComponent = new Vue({
  mixins: [itemHelper]
});

describe('itemHelper', () => {
  it('Correctly returns true if the item can be resumed', () => {
    expect(TestComponent.canPlay({ Type: 'MusicGenre' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Season' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Series' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'BoxSet' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicAlbum' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'MusicArtist' })).toEqual(true);
    expect(TestComponent.canPlay({ Type: 'Playlist' })).toEqual(true);

    expect(TestComponent.canPlay({ MediaType: 'Video' })).toEqual(true);
    expect(TestComponent.canPlay({ MediaType: 'Audio' })).toEqual(true);

    expect(TestComponent.canPlay({})).toEqual(false);
  });

  it('Correctly returns true if the item can be resumed - 2', () => {
    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 1 } })
    ).toEqual(true);

    expect(
      TestComponent.canResume({ UserData: { PlaybackPositionTicks: 0 } })
    ).toEqual(false);

    expect(TestComponent.canResume({ UserData: {} })).toEqual(false);
  });
});
