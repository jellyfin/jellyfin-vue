import {
  BaseItemDto,
  UserDto,
  ItemFields,
  ItemFilter
} from '@jellyfin/client-axios';
import { union, uniqBy } from 'lodash';

/**
 * Converts an item into a set of playable items for the playback manager to handle.
 *
 * @param {BaseItemDto[]} items - Array of items to translate for playback
 * @returns {BaseItemDto[]} A set of playable items
 */
export async function translateItemsForPlayback(
  items: BaseItemDto[]
): Promise<BaseItemDto[]> {
  if (!items) {
    throw new TypeError('item must be defined');
  }

  let translatedItems: BaseItemDto[] = [];
  for (const item of items) {
    let responseItems;
    if (item.Type === 'Program' && item.ChannelId) {
      responseItems =
        (
          await window.$nuxt.$api.items.getItems({
            userId: window.$nuxt.$auth.user.Id,
            ids: [item.ChannelId]
          })
        ).data.Items || [];
    } else if (item.Type === 'Playlist') {
      responseItems =
        (
          await window.$nuxt.$api.items.getItems({
            userId: window.$nuxt.$auth.user.Id,
            parentId: item.Id
          })
        ).data.Items || [];
    } else if (item.Type === 'MusicArtist' && item.Id) {
      responseItems =
        (
          await window.$nuxt.$api.items.getItems({
            userId: window.$nuxt.$auth.user.Id,
            artistIds: [item.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: 'SortName',
            mediaTypes: ['Audio']
          })
        ).data.Items || [];
    } else if (item.Type === 'MusicGenre' && item.Id) {
      responseItems =
        (
          await window.$nuxt.$api.items.getItems({
            userId: window.$nuxt.$auth.user.Id,
            genreIds: [item.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: 'SortName',
            mediaTypes: ['Audio']
          })
        ).data.Items || [];
    } else if (item.IsFolder) {
      responseItems =
        (
          await window.$nuxt.$api.items.getItems({
            userId: window.$nuxt.$auth.user.Id,
            parentId: item.Id,
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: !['BoxSet'].includes(item.Type || '')
              ? 'SortName'
              : undefined,
            mediaTypes: ['Audio', 'Video']
          })
        ).data.Items || [];
    } else if (item.Type === 'Episode' && items.length === 1) {
      if (
        (window.$nuxt.$auth.user as UserDto).Configuration
          ?.EnableNextEpisodeAutoPlay &&
        item.SeriesId
      ) {
        // If autoplay is enabled and we have a seriesId, get the rest of the episodes
        responseItems =
          (
            await window.$nuxt.$api.tvShows.getEpisodes({
              userId: (window.$nuxt.$auth.user as UserDto).Id,
              seriesId: item.SeriesId,
              isMissing: false,
              fields: [ItemFields.Chapters],
              startItemId: item.Id
            })
          ).data.Items || item;
      } else {
        translatedItems.push(item);
      }
    } else {
      // This type of item doesn't require any special processing
      translatedItems = items;
    }

    if (responseItems) {
      if (Array.isArray(responseItems)) {
        responseItems = Array.from(responseItems);
        translatedItems = union(translatedItems, responseItems);
      } else {
        translatedItems.push(responseItems);
      }
    }
  }
  return uniqBy(translatedItems, 'Id');
}
