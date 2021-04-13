import {
  BaseItemDto,
  UserDto,
  ItemFields,
  ItemFilter
} from '@jellyfin/client-axios';

/**
 * Converts an item into a set of playable items for the playback manager to handle.
 *
 * @param {BaseItemDto} item - Array of items to translate for playback
 * @returns {BaseItemDto[]} A set of playable items
 */
export async function translateItemsForPlayback(
  item: BaseItemDto,
  shuffle = false
): Promise<BaseItemDto[]> {
  console.time('Translating items for playback');

  if (!item) {
    throw new TypeError('item must be defined');
  }

  let translatedItems: BaseItemDto[] = [];

  let responseItems: BaseItemDto[] = [];

  if (item.Type === 'Program' && item.ChannelId) {
    responseItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          ids: [item.ChannelId],
          limit: 300,
          sortOrder: shuffle ? 'Random' : 'SortName'
        })
      ).data.Items || [];
  } else if (item.Type === 'Playlist') {
    responseItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          parentId: item.Id,
          limit: 300,
          sortOrder: shuffle ? 'Random' : 'SortName'
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
          mediaTypes: ['Audio'],
          limit: 300,
          sortOrder: shuffle ? 'Random' : 'SortName'
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
          mediaTypes: ['Audio'],
          limit: 300,
          sortOrder: shuffle ? 'Random' : 'SortName'
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
          sortBy: ['BoxSet'].includes(item.Type || '')
            ? undefined
            : shuffle
            ? 'Random'
            : 'SortName',
          mediaTypes: ['Audio', 'Video'],
          limit: 300
        })
      ).data.Items || [];
  } else if (item.Type === 'Episode') {
    if (
      (window.$nuxt.$auth.user as UserDto).Configuration
        ?.EnableNextEpisodeAutoPlay &&
      item.SeriesId
    ) {
      // If autoplay is enabled and we have a seriesId, get the rest of the episodes
      responseItems = (
        await window.$nuxt.$api.tvShows.getEpisodes({
          userId: (window.$nuxt.$auth.user as UserDto).Id,
          seriesId: item.SeriesId,
          isMissing: false,
          fields: [ItemFields.Chapters, ItemFields.PrimaryImageAspectRatio],
          startItemId: item.Id,
          limit: 300
        })
      ).data.Items || [item];
    } else {
      translatedItems.push(item);
    }
  } else {
    // This type of item doesn't require any special processing
    translatedItems = [item];
  }

  if (responseItems) {
    translatedItems.push(...responseItems);
  }

  console.timeEnd('Translating items for playback');

  return translatedItems;
}
