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
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto) => string;
  }

  interface NuxtAppOptions {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto) => string;
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
     * @param {string} overrideType - Force the type to use
     * @returns {string} A valid route to the item's details page
     */
    getItemDetailsLink(item: BaseItemDto, overrideType?: string): string {
      let routeName: string;
      let routeParams: Record<never, never>;

      if (item.Type && validLibraryTypes.includes(item.Type)) {
        routeName = 'library-viewId';
        routeParams = { viewId: item.Id };
      } else {
        const type = overrideType || item.Type;
        switch (type) {
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
    },
    /**
     * Returns the appropiate material design icon for the BaseItemDto provided
     *
     * @param {BaseItemDto} item - The item we want to get the icon for
     * @returns {string} - The string that references the icon
     */
    getItemIcon(item: BaseItemDto): string {
      switch (item.Type) {
        case 'Audio':
          return 'mdi-music-note';
        case 'Book':
          return 'mdi-book-open-page-variant';
        case 'BoxSet':
          return 'mdi-folder-multiple';
        case 'Folder':
        case 'CollectionFolder':
          return 'mdi-folder';
        case 'Movie':
          return 'mdi-filmstrip';
        case 'MusicAlbum':
          return 'mdi-album';
        case 'MusicArtist':
        case 'Person':
          return 'mdi-account';
        case 'PhotoAlbum':
          return 'mdi-image-multiple';
        case 'Playlist':
          return 'mdi-playlist-play';
        case 'Series':
        case 'Episode':
          return 'mdi-television-classic';
        default:
          return '';
      }
    }
  }
});

export default itemHelper;
