/*
 * @Author: your name
 * @Date: 2020-09-20 16:22:36
 * @LastEditTime: 2020-10-03 11:39:32
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /jellyfin-vue/utils/items.ts
 */
import { BaseItemPerson } from '~/api';

/**
 * Get the Material Design Icon name associated with a type of library
 *
 * @param {(string | undefined | null)} libraryType - Type of the library
 * @returns {string} Name of the Material Design Icon associated with the type
 */
export function getLibraryIcon(libraryType: string | undefined | null): string {
  switch (libraryType) {
    case 'movies':
      return 'mdi-movie';
    case 'music':
      return 'mdi-music';
    case 'photos':
      return 'mdi-image';
    case 'livetv':
      return 'mdi-youtube-tv';
    case 'tvshows':
      return 'mdi-television-classic';
    case 'homevideos':
      return 'mdi-image-multiple';
    case 'musicvideos':
      return 'mdi-music-box';
    case 'books':
      return 'mdi-book-open-page-variant';
    case 'channels':
      return 'mdi-youtube';
    case 'playlists':
      return 'mdi-playlist-play';
    default:
      return 'mdi-folder';
  }
}

/**
 * Get the card shape associated with a collection type
 *
 * @param {(string | null | undefined)} collectionType - Type of the collection
 * @returns {string} CSS class to use as the shape of the card
 */
export function getShapeFromCollectionType(
  collectionType: string | null | undefined
): string {
  switch (collectionType) {
    case 'boxsets':
    case 'movies':
    case 'tvshows':
    case 'books':
      return 'portrait-card';
    case 'livetv':
      return 'thumb-card';
    case 'folders':
    case 'playlists':
    case 'music':
    default:
      return 'square-card';
  }
}
/**
 * Get the image url
 *
 * @param  {BaseItemPerson} person
 * @param  {{width:number;height:number;quality:number}} options
 * @returns string
 */
export function getPersonImage(
  person: BaseItemPerson,
  options: { width: number; height: number; quality: number }
): string {
  return `${window.location.origin}/Items/${
    person.Id
  }/Images/Primary?maxWidth=${options.width || 750}&tag=${
    person.PrimaryImageTag
  }&quality=${options.quality || 90}`;
}
