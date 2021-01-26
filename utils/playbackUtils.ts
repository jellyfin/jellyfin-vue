import {
  BaseItemDto,
  UserDto,
  ItemFields,
  ItemFilter
} from '@jellyfin/client-axios';

/**
 * Converts an item into a set of playable items for the playback manager to handle.
 *
 * @param {BaseItemDto[]} items - Array of items to translate for playback
 * @returns {BaseItemDto[]} A set of playable items
 */
export async function translateItemForPlayback(
  items: BaseItemDto[]
): Promise<BaseItemDto[]> {
  if (!items) {
    throw new TypeError('item must be defined');
  }

  const firstItem = items[0];

  let translatedItems: BaseItemDto[] = [];

  if (firstItem.Type === 'Program' && firstItem.ChannelId) {
    translatedItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          ids: [firstItem.ChannelId]
        })
      ).data.Items || [];
  } else if (firstItem.Type === 'Playlist') {
    translatedItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          parentId: firstItem.Id
        })
      ).data.Items || [];
  } else if (firstItem.Type === 'MusicArtist' && firstItem.Id) {
    translatedItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          artistIds: [firstItem.Id],
          filters: [ItemFilter.IsNotFolder],
          recursive: true,
          sortBy: 'SortName',
          mediaTypes: ['Audio']
        })
      ).data.Items || [];
  } else if (firstItem.Type === 'MusicGenre' && firstItem.Id) {
    translatedItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          genreIds: [firstItem.Id],
          filters: [ItemFilter.IsNotFolder],
          recursive: true,
          sortBy: 'SortName',
          mediaTypes: ['Audio']
        })
      ).data.Items || [];
  } else if (firstItem.IsFolder) {
    translatedItems =
      (
        await window.$nuxt.$api.items.getItems({
          userId: window.$nuxt.$auth.user.Id,
          parentId: firstItem.Id,
          filters: [ItemFilter.IsNotFolder],
          recursive: true,
          sortBy: !['BoxSet'].includes(firstItem.Type || '')
            ? 'SortName'
            : undefined,
          mediaTypes: ['Audio', 'Video']
        })
      ).data.Items || [];
  } else if (firstItem.Type === 'Episode' && items.length === 1) {
    if (
      (window.$nuxt.$auth.user as UserDto).Configuration
        ?.EnableNextEpisodeAutoPlay &&
      firstItem.SeriesId
    ) {
      // If autoplay is enabled and we have a seriesId, get the rest of the episodes
      translatedItems =
        (
          await window.$nuxt.$api.tvShows.getEpisodes({
            userId: (window.$nuxt.$auth.user as UserDto).Id,
            seriesId: firstItem.SeriesId,
            isMissing: false,
            fields: [ItemFields.Chapters],
            startItemId: firstItem.Id
          })
        ).data.Items || items;
    } else {
      translatedItems = items;
    }
  } else {
    // This type of item doesn't require any special processing
    translatedItems = items;
  }

  return translatedItems;
}
