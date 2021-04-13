/**
 * Item and playback helpers
 *
 * @mixin
 */
import { BaseItemDto, BaseItemPerson } from '@jellyfin/client-axios';
import Vue from 'vue';
import { isPerson, validLibraryTypes } from '~/utils/items';

declare module '@nuxt/types' {
  interface Context {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    canMarkWatched: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto | BaseItemPerson) => string;
  }

  interface NuxtAppOptions {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    canMarkWatched: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto | BaseItemPerson) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    canPlay: (item: BaseItemDto) => boolean;
    canResume: (item: BaseItemDto) => boolean;
    canMarkWatched: (item: BaseItemDto) => boolean;
    getItemDetailsLink: (item: BaseItemDto, overrideType?: string) => string;
    getItemIcon: (item: BaseItemDto | BaseItemPerson) => string;
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
    canPlay(item: BaseItemDto | undefined): boolean {
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
     * Determine if an item can be mark as played
     *
     * @param {BaseItemDto} item - Determines if an item can be marked as played
     * @returns {boolean} Whether the item can be mark played or not
     */
    canMarkWatched(item: BaseItemDto): boolean {
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
     * @param {BaseItemDto | BaseItemPerson} item - The item we want to get the icon for
     * @returns {string} - The string that references the icon
     */
    getItemIcon(item: BaseItemDto | BaseItemPerson): string {
      let itemIcon = '';

      if (isPerson(item)) {
        itemIcon = 'mdi-account';
      } else {
        switch (item.Type) {
          case 'Audio':
            itemIcon = 'mdi-music-note';
            break;
          case 'Book':
            itemIcon = 'mdi-book-open-page-variant';
            break;
          case 'BoxSet':
            itemIcon = 'mdi-folder-multiple';
            break;
          case 'Folder':
          case 'CollectionFolder':
            itemIcon = 'mdi-folder';
            break;
          case 'Movie':
            itemIcon = 'mdi-filmstrip';
            break;
          case 'MusicAlbum':
            itemIcon = 'mdi-album';
            break;
          case 'MusicArtist':
          case 'Person':
            itemIcon = 'mdi-account';
            break;
          case 'PhotoAlbum':
            itemIcon = 'mdi-image-multiple';
            break;
          case 'Playlist':
            itemIcon = 'mdi-playlist-play';
            break;
          case 'Series':
          case 'Episode':
            itemIcon = 'mdi-television-classic';
            break;
        }
      }

      return itemIcon;
    }
  }
});

export default itemHelper;
