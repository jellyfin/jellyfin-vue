import { BaseItemDto } from '@jellyfin/client-axios';
/**
 * Item and playback helpers
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
  }

  interface NuxtAppOptions {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
  }
}

const itemHelper = Vue.extend({
  methods: {
    /**
     * Test if the passed item can be played by one of the players in the client.
     *
     * @param {BaseItemDto} item - The item to be tested for playback support
     * @returns {boolean} Whether the item can be played on this client or not
     */
    canPlay(item: BaseItemDto): boolean {
      const itemType = item.Type || '';
      const itemMediaType = item.MediaType || '';

      if (
        [
          'MusicGenre',
          'Season',
          'Series',
          'BoxSet',
          'MusicAlbum',
          'MusicArtist',
          'Playlist'
        ].includes(itemType) ||
        ['Video', 'Audio'].includes(itemMediaType)
      ) {
        return true;
      }

      return false;
    },
    canResume(item: BaseItemDto): boolean {
      if (
        item?.UserData?.PlaybackPositionTicks &&
        item.UserData.PlaybackPositionTicks > 0
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
});

export default itemHelper;
