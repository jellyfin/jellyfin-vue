/**
 * Item and playback helpers
 *
 * @mixin
 */
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { validLibraryTypes } from '~/utils/items';

declare module '@nuxt/types' {
  interface Context {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto) => string;
  }

  interface NuxtAppOptions {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto) => string;
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
    },
    /**
     * Generate a link to the item's details page route
     *
     * @param {BaseItemDto} item - The item used to generate the route
     * @returns {string} A valid route to the item's details page
     */
    getItemDetailsLink(item: BaseItemDto): string {
      let routeName: string;
      let routeParams: Record<never, never>;

      if (item.Type && validLibraryTypes.includes(item.Type)) {
        routeName = 'library-viewId';
        routeParams = { viewId: item.Id };
      } else {
        switch (item.Type) {
          case 'Series':
            routeName = 'series-itemId';
            routeParams = { itemId: item.Id };
            break;
          case 'Person':
            routeName = 'person-itemId';
            routeParams = { itemId: item.Id };
            break;
          case 'MusicArtist':
            routeName = 'artist-itemId';
            routeParams = { itemId: item.Id };
            break;
          case 'MusicAlbum':
            routeName = 'musicalbum-itemId';
            routeParams = { itemId: item.Id };
            break;
          case 'Genre':
            routeName = 'genre-itemId';
            routeParams = { itemId: item.Id };
            break;
          default:
            routeName = 'item-itemId';
            routeParams = { itemId: item.Id };
            break;
        }
      }

      return this.$router.resolve({
        name: routeName,
        params: routeParams
      }).href;
    }
  }
});

export default itemHelper;
