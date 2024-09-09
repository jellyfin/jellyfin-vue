<template>
  <GenericItemCard
    :progress="progress"
    :shape="shape ?? cardType"
    :overlay="overlay"
    :force-overlay="isMenuOpen"
    :to="cardTitleLink"
    :margin="margin">
    <template #image>
      <BlurhashImage
        :item="item"
        :type="getImageType" />
    </template>
    <template #upper-content>
      <VProgressCircular
        v-if="refreshProgress !== undefined"
        :model-value="refreshProgress"
        :indeterminate="refreshProgress === 0"
        size="24" />
      <WatchedIndicator v-if="item.UserData && item.UserData.Played" />
      <VChip
        v-if="item.UserData && item.UserData.UnplayedItemCount"
        color="primary"
        variant="elevated"
        size="small">
        {{ item.UserData.UnplayedItemCount }}
      </VChip>
    </template>
    <template
      v-if="canPlay(item)"
      #center-content>
      <PlayButton
        fab
        :item="item" />
    </template>
    <template #bottom-content>
      <MarkPlayedButton :item="item" />
      <LikeButton
        v-if="canPlay(item)"
        :item="item" />
      <ItemMenu
        :item="item"
        @active="isMenuOpen = true"
        @inactive="isMenuOpen = false" />
    </template>
    <template
      v-if="text"
      #title>
      <RouterLink
        class="link"
        :to="cardTitleLink">
        {{ cardTitle ?? '' }}
      </RouterLink>
    </template>
    <template
      v-if="text"
      #subtitle>
      <RouterLink
        v-if="cardSubtitleLink"
        class="link"
        :to="cardSubtitleLink">
        {{ cardSubtitle ?? '' }}
      </RouterLink>
      <div v-else>
        {{ cardSubtitle ?? '' }}
      </div>
    </template>
  </GenericItemCard>
</template>

<script setup lang="ts">

import {
  BaseItemKind,
  ImageType,
  type BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { isNil } from '@/utils/validation';
import {
  CardShapes,
  canPlay,
  getItemDetailsLink,
  getShapeFromItemType
} from '@/utils/items';
import { taskManager } from '@/store/task-manager';

const { item, shape, overlay, text, margin } = defineProps<{
  item: BaseItemDto;
  shape?: CardShapes;
  overlay?: boolean;
  text?: boolean;
  margin?: boolean;
}>();

const { t } = useI18n();
const isMenuOpen = shallowRef(false);

const cardType = computed(() => getShapeFromItemType(item.Type));

const cardTitle = computed(() =>
  item.Type === BaseItemKind.Episode
    ? item.SeriesName
    : item.Name
);

/**
 * Returns either a string representing the production year(s) for the current item
 * or the episode name of an item (SX EY - Episode Name)
 * or the album artist
 */
const cardSubtitle = computed(() => {
  switch (item.Type) {
    case BaseItemKind.Episode: {
      return !isNil(item.ParentIndexNumber) && !isNil(item.IndexNumber) && !isNil(item.Name)
        ? `${t('seasonEpisodeAbbrev', {
          seasonNumber: item.ParentIndexNumber,
          episodeNumber: item.IndexNumber
        })} - ${item.Name}`
        : undefined;
    }
    case BaseItemKind.MusicAlbum: {
      return item.AlbumArtist;
    }
    case BaseItemKind.Series: {
      if (item.Status === 'Continuing' && !isNil(item.ProductionYear)) {
        return `${item.ProductionYear} - ${t('present')}`;
      } else if (item.EndDate) {
        const endYear = new Date(item.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });

        if (String(item.ProductionYear) === endYear) {
          return String(item.ProductionYear);
        }

        return isNil(item.ProductionYear) ? undefined : `${item.ProductionYear} - ${endYear}`;
      }

      break;
    }
    default: {
      return item.ProductionYear;
    }
  }
});

/**
 * Gets a link to be applied to the card title
 *
 * @returns A router link to the item or a related item
 */
const cardTitleLink = computed(() => {
  if (item.Type === BaseItemKind.Episode && item.SeriesId) {
    return getItemDetailsLink({ Id: item.SeriesId }, 'Series');
  }

  return getItemDetailsLink(item);
});

/**
 * Gets a link to be applied to the card subtitle
 *
 * @returns A router link to the parent item or a related item
 */
const cardSubtitleLink = computed(() => {
  if (
    item.Type === BaseItemKind.MusicAlbum
    && item.AlbumArtists?.length
  ) {
    return getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist');
  } else if (item.Type === BaseItemKind.Episode) {
    return getItemDetailsLink(item);
  }
});

const progress = computed(
  () => item.UserData?.PlayedPercentage ?? undefined
);

const getImageType = computed(() =>
  cardType.value === CardShapes.Thumb ? ImageType.Thumb : ImageType.Primary
);

/**
 * Gets the library update progress
 */
const refreshProgress = computed(
  () => taskManager.getTask(item.Id || '')?.progress
);
</script>
