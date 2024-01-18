<template>
  <div :class="{ 'card-margin': margin }">
    <Component
      :is="link ? 'router-link' : 'div'"
      :to="link ? getItemDetailsLink(item) : null"
      :class="{ 'card-box': link }">
      <div
        :class="shape || cardType"
        class="elevation-2">
        <div
          class="absolute-cover card-content d-flex justify-center align-center">
          <BlurhashImage
            :item="item"
            :type="getImageType"
            :alt="item.Name || ''"
            class="card-image" />
        </div>
        <div
          class="absolute-cover card-overlay d-flex justify-center align-center"
          :class="{ 'card-overlay-hover': overlay && isFinePointer }">
          <div class="card-upper-content d-flex justify-center align-center">
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
          </div>
          <div class="card-overlay-hover-hidden">
            <PlayButton
              fab
              :item="item" />
            <div class="card-lower-content d-flex justify-center align-center">
              <MarkPlayedButton :item="item" />
              <LikeButton
                v-if="canPlay(item)"
                :item="item" />
              <ItemMenu :item="item" />
            </div>
          </div>
          <VProgressLinear
            v-if="
              item.UserData &&
                item.UserData.PlayedPercentage &&
                item.UserData.PlayedPercentage > 0
            "
            v-model="progress"
            absolute
            location="bottom" />
        </div>
      </div>
    </Component>
    <div
      v-if="text"
      class="card-text">
      <RouterLink
        class="link d-block font-weight-medium pa-0 mt-1 text-truncate"
        :to="cardTitleLink">
        {{ cardTitle }}
      </RouterLink>
      <RouterLink
        v-if="cardSubtitleLink"
        class="link d-block v-card-subtitle text-truncate"
        :to="cardSubtitleLink">
        {{ cardSubtitle ?? '' }}
      </RouterLink>
      <div
        v-else
        class="v-card-subtitle text-truncate">
        {{ cardSubtitle ?? '' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  BaseItemKind,
  ImageType,
  type BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { isNil } from '@/utils/validation';
import {
  CardShapes,
  canPlay,
  getItemDetailsLink,
  getShapeFromItemType
} from '@/utils/items';
import { taskManager } from '@/store/taskManager';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const isFinePointer = useMediaQuery('(pointer:fine)');
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    item: BaseItemDto;
    shape?: string | boolean;
    episode?: boolean;
    overlay?: boolean;
    text?: boolean;
    margin?: boolean;
    link?: boolean;
  }>(),
  {
    shape: false,
    episode: false,
    overlay: false,
    text: false,
    margin: false,
    link: false
  }
);

const { t } = useI18n();

const cardType = computed(() => getShapeFromItemType(props.item.Type));

const cardTitle = computed(() =>
  props.item.Type === BaseItemKind.Episode
    ? props.item.SeriesName || ''
    : props.item.Name || ''
);

/**
 * Returns either a string representing the production year(s) for the current item
 * or the episode name of an item (SX EY - Episode Name)
 * or the album artist
 */
const cardSubtitle = computed(() => {
  switch (props.item.Type) {
    case BaseItemKind.Episode: {
      return !isNil(props.item.ParentIndexNumber) && !isNil(props.item.IndexNumber) && !isNil(props.item.Name) ? `${t('seasonEpisodeAbbrev', {
        seasonNumber: props.item.ParentIndexNumber,
        episodeNumber: props.item.IndexNumber
      })} - ${props.item.Name}` : undefined;
    }
    case BaseItemKind.MusicAlbum: {
      return props.item.AlbumArtist;
    }
    case BaseItemKind.Series: {
      if (props.item.Status === 'Continuing' && !isNil(props.item.ProductionYear)) {
        return `${props.item.ProductionYear} - ${t('present')}`;
      } else if (props.item.EndDate) {
        const endYear = new Date(props.item?.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });

        if (String(props.item.ProductionYear) === endYear) {
          return String(props.item.ProductionYear);
        }

        return isNil(props.item.ProductionYear) ? undefined: `${props.item.ProductionYear} - ${endYear}`;
      }

      break;
    }
    default: {
      return props.item.ProductionYear;
    }
  }
});

/**
 * Gets a link to be applied to the card title
 *
 * @returns A router link to the item or a related item
 */
const cardTitleLink = computed(() => {
  if (props.item.Type === BaseItemKind.Episode && props.item.SeriesId) {
    return getItemDetailsLink({ Id: props.item.SeriesId }, 'Series');
  }

  return getItemDetailsLink(props.item);
});

/**
 * Gets a link to be applied to the card subtitle
 *
 * @returns A router link to the parent item or a related item
 */
const cardSubtitleLink = computed(() => {
  if (
    props.item.Type === BaseItemKind.MusicAlbum &&
    props.item.AlbumArtists &&
    props.item.AlbumArtists.length > 0
  ) {
    return getItemDetailsLink(props.item.AlbumArtists[0], 'MusicArtist');
  } else if (props.item.Type === BaseItemKind.Episode) {
    return getItemDetailsLink(props.item);
  }
});

const progress = computed(
  () => props.item.UserData?.PlayedPercentage || undefined
);

const getImageType = computed(() =>
  props.shape === CardShapes.Thumb ? ImageType.Thumb : ImageType.Primary
);

/**
 * Gets the library update progress
 */
const refreshProgress = computed(
  () => taskManager.getTask(props.item.Id || '')?.progress
);
</script>

<style lang="scss">
.portrait-card {
  position: relative;
  padding-bottom: 150%;
  contain: strict;
  border-radius: 0.3em;
}

.thumb-card {
  position: relative;
  padding-bottom: 56.25%;
  contain: strict;
  border-radius: 0.3em;
}

.square-card {
  position: relative;
  padding-bottom: 100%;
  contain: strict;
  border-radius: 0.3em;
}

.card-image {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss" scoped>
.card-upper-content {
  position: absolute;
  right: 0.5em;
  top: 0.5em;
  gap: 0.3em;
}
.card-lower-content {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
  gap: 0.3em;
}

.card-margin {
  margin: 0.6em;
}

.card-content {
  background-color: rgb(var(--v-theme-menu));
  overflow: hidden;
  margin: 0 !important;
  contain: strict;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}

.card-overlay {
  transition: all 0.2s;
}

.overlay-hover {
  transition: opacity 0.2s;
}

.card-overlay-hover-hidden {
  transition: inherit;
  opacity: 0;
}

@media (hover: hover) and (pointer: fine) {
  .card-box:hover .card-overlay-hover {
    background: rgba(var(--v-theme-background), 0.5);
  }
  .card-box:hover .card-overlay-hover .card-overlay-hover-hidden {
    opacity: 1;
  }
}

.card-text {
  text-align: center;
  padding: 0 0.25em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

a.card-box {
  text-decoration: none;
  color: unset;
}

.absolute {
  position: absolute;
}
</style>
