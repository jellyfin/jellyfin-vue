<template>
  <div
    v-focus="!!link"
    :class="{ 'card-margin': margin }"
    @keyup.enter="cardClicked($router)">
    <component
      :is="link ? 'router-link' : 'div'"
      :to="link ? getItemDetailsLink(item) : null"
      :class="{ 'card-box': link }">
      <!-- CARD -->
      <div :class="shape || cardType" class="elevation-2">
        <div
          class="card-content card-content-button d-flex justify-center align-center darken-4">
          <blurhash-image
            :item="item"
            :type="getImageType"
            :alt="item.Name || ''"
            class="card-image" />
          <v-progress-circular
            v-if="refreshProgress !== undefined"
            class="card-chip"
            :model-value="refreshProgress"
            :indeterminate="refreshProgress === 0"
            color="white"
            size="24" />
          <watched-indicator v-if="item.UserData && item.UserData.Played" />
          <v-chip
            v-if="item.UserData && item.UserData.UnplayedItemCount"
            color="primary"
            variant="elevated"
            class="card-chip"
            size="small">
            {{ item.UserData.UnplayedItemCount }}
          </v-chip>
          <v-progress-linear
            v-if="
              item.UserData &&
              item.UserData.PlayedPercentage &&
              item.UserData.PlayedPercentage > 0
            "
            v-model="progress"
            color="primary-accent-4"
            absolute
            location="bottom" />
        </div>
        <div
          v-if="overlay && isFinePointer"
          class="card-overlay d-flex justify-center align-center">
          <play-button fab :item="item" />
          <div
            v-if="overlay"
            class="card-lower-buttons d-flex justify-center align-center">
            <mark-played-button :item="item" />
            <like-button v-if="canPlay(item)" :item="item" />
            <item-menu :item="item" />
          </div>
        </div>
      </div>
    </component>
    <div v-if="text" class="card-text">
      <router-link
        class="link d-block font-weight-medium pa-0 mt-1 text-truncate"
        :to="cardTitleLink">
        {{ cardTitle }}
      </router-link>
      <router-link
        v-if="cardSubtitleLink"
        class="link d-block v-card-subtitle text-truncate"
        :to="cardSubtitleLink">
        {{ cardSubtitle }}
      </router-link>
      <div v-else class="v-card-subtitle text-truncate">
        {{ cardSubtitle }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import {
  BaseItemDto,
  BaseItemKind,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import {
  CardShapes,
  getShapeFromItemType,
  getItemDetailsLink,
  canPlay
} from '@/utils/items';
import { taskManagerStore } from '@/store';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const isFinePointer = useMediaQuery('(pointer:fine)');
</script>

<script lang="ts" setup>
import { Router } from 'vue-router';

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

const taskManager = taskManagerStore();
const { t } = useI18n();

const cardType = computed(() => getShapeFromItemType(props.item.Type));

const cardTitle = computed(() =>
  props.item.Type === BaseItemKind.Episode
    ? props.item.SeriesName || ''
    : props.item.Name || ''
);

/**
 * Takes you to subtitle link or cardlink if no subtitle link
 */
function cardClicked(router: Router): void {
  if (props.link && (cardTitleLink.value || cardSubtitleLink.value)) {
    router.push(cardSubtitleLink.value || cardTitleLink.value);
  }
}

/**
 * Returns either a string representing the production year(s) for the current item
 * or the episode name of an item (SX EY - Episode Name)
 * or the album artist
 */
const cardSubtitle = computed(() => {
  switch (props.item.Type) {
    case BaseItemKind.Episode: {
      return `${t('seasonEpisodeAbbrev', {
        seasonNumber: props.item.ParentIndexNumber,
        episodeNumber: props.item.IndexNumber
      })} - ${props.item.Name}`;
    }
    case BaseItemKind.MusicAlbum: {
      return `${props.item.AlbumArtist || ''}`;
    }
    case BaseItemKind.Series: {
      if (props.item.Status === 'Continuing') {
        return `${props.item.ProductionYear} - ${t('present')}`;
      } else if (props.item.EndDate) {
        const endYear = new Date(props.item?.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });

        if (props.item.ProductionYear?.toString() === endYear) {
          return props.item.ProductionYear.toString();
        }

        return `${props.item.ProductionYear} - ${endYear}`;
      }

      break;
    }
    default: {
      return `${props.item.ProductionYear || ''}`;
    }
  }

  return '';
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

<style lang="scss" scoped>
.card-lower-buttons {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
  gap: 0.3em;
}

.card-margin {
  margin: 0.6em;
}

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

.card-content {
  background-color: rgb(var(--v-theme-menu));
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 !important;
  height: 100%;
  width: 100%;
  contain: strict;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}

.card-image {
  width: 100%;
  height: 100%;
}

.card-overlay {
  position: absolute;
  background: radial-gradient(
    farthest-corner at 50% 50%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  transition: opacity 0.2s;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
}

@media (hover: hover) and (pointer: fine) {
  .card-box:hover .card-overlay {
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

.a {
  text-decoration: none;
}

.absolute {
  position: absolute;
}

.card-margin:focus-within,
.card-margin:focus {
  box-shadow: 0 0 0 5px rgb(var(--v-theme-primary));
  border-radius: 5px;
  outline: none;
  background-color: rgb(var(--v-theme-primary));
}
</style>
