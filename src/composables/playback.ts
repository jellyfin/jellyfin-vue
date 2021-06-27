import { BaseItemDto } from '@jellyfin/client-axios';

export function usePlayback() {
  /**
   * Test if the passed item can be played by one of the players in the client.
   *
   * @param {BaseItemDto} item - The item to be tested for playback support
   * @returns {boolean} Whether the item can be played on this client or not
   */
  function canPlay(item: BaseItemDto | undefined): boolean {
    if (item === undefined) {
      return false;
    }

    if (
      [
        'Audio',
        'AudioBook',
        'BoxSet',
        'Episode',
        'Movie',
        'MusicAlbum',
        'MusicArtist',
        'MusicGenre',
        'MusicVideo',
        'Playlist',
        'Season',
        'Series',
        'Trailer',
        'Video'
      ].includes(item.Type || '') ||
      ['Video', 'Audio'].includes(item.MediaType || '') ||
      item.IsFolder
    ) {
      return true;
    }

    return false;
  }

  function canResume(item: BaseItemDto): boolean {
    if (
      item?.UserData?.PlaybackPositionTicks &&
      item.UserData.PlaybackPositionTicks > 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Determine if an item can be mark as played
   *
   * @param {BaseItemDto} item - Determines if an item can be marked as played
   * @returns {boolean} Whether the item can be mark played or not
   */
  function canMarkWatched(item: BaseItemDto): boolean {
    if (
      ['Series', 'Season', 'BoxSet', 'AudioPodcast', 'AudioBook'].includes(
        item.Type || ''
      )
    ) {
      return true;
    }

    if (item.MediaType === 'Video' && item.Type !== 'TvChannel') {
      return true;
    }

    return false;
  }

  return { canPlay, canResume, canMarkWatched };
}
