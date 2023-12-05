<template>
  <div>
    <VAppBar
      density="compact"
      flat>
      <span class="text-h6 hidden-sm-and-down">
        {{ library?.Name }}
      </span>
      <VChip
        :size="!loading ? 'small' : undefined"
        class="ma-2 hidden-sm-and-down">
        <template v-if="!loading">
          {{ items?.length ?? 0 }}
        </template>
        <VProgressCircular
          v-else
          width="2"
          indeterminate
          size="16" />
      </VChip>
      <VDivider
        inset
        vertical
        class="mx-2 hidden-sm-and-down" />
      <TypeButton
        v-if="hasViewTypes"
        :type="library?.CollectionType ?? undefined"
        :disabled="loading"
        @change="onChangeType" />
      <VDivider
        v-if="isSortable && hasViewTypes"
        inset
        vertical
        class="mx-2" />
      <SortButton
        v-if="isSortable"
        :disabled="loading"
        :ascending="sortAscending"
        @change="onChangeSort" />
      <FilterButton
        v-if="library && viewType && isSortable"
        :item="library"
        :disabled="loading"
        @change="onChangeFilter" />
      <VSpacer />
      <PlayButton
        v-if="library"
        :item="library"
        shuffle
        :disabled="playButtonDisabled" />
      <PlayButton
        v-if="library"
        :item="library"
        :disabled="playButtonDisabled" />
    </VAppBar>
    <VContainer>
      <SkeletonItemGrid
        v-if="loading"
        :view-type="viewType" />
      <ItemGrid
        v-else
        :items="items">
        <h1
          v-if="!hasFilters"
          class="text-h5">
          {{ hasFilters ? t('libraryEmptyFilters') : t('libraryEmpty') }}
        </h1>
      </ItemGrid>
    </VContainer>
    <ScrollToTopButton />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router/auto';
import {
  BaseItemDto,
  BaseItemKind,
  ItemFields
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getMusicGenresApi } from '@jellyfin/sdk/lib/utils/api/music-genres-api';
import { getStudiosApi } from '@jellyfin/sdk/lib/utils/api/studios-api';
import { isNil } from 'lodash-es';
import { useRemote, useSnackbar } from '@/composables';
import type { Filters } from '@/components/Buttons/FilterButton.vue';

const { t } = useI18n();
const route = useRoute<'/library/[itemId]'>();
const remote = useRemote();

const COLLECTION_TYPES_MAPPINGS: { [key: string]: BaseItemKind } = {
  tvshows: BaseItemKind.Series,
  movies: BaseItemKind.Movie,
  books: BaseItemKind.Book,
  music: BaseItemKind.MusicAlbum,
  boxsets: BaseItemKind.BoxSet
};

const library = ref<BaseItemDto>();
const loadingLibrary = ref(false);
const items = ref<BaseItemDto[]>([]);
const loadingItems = ref(false);
const viewType = ref<BaseItemKind>();
const sortBy = ref<string>();
const sortAscending = ref(true);
const filters = ref<Filters>({
  status: [],
  features: [],
  genres: [],
  ratings: [],
  types: [],
  years: []
});

/**
 * Updates viewType value when it is changed
 */
function onChangeType(type?: BaseItemKind): void {
  viewType.value = type;
}

/**
 * Updates sort value when it is changed
 */
function onChangeSort(sort: string, ascending: boolean): void {
  sortBy.value = sort;
  sortAscending.value = ascending;
}

/**
 * Updates filters when they are changed
 */
function onChangeFilter(changedFilters: Filters): void {
  filters.value = changedFilters;
}

const loading = computed(() => loadingLibrary.value || loadingItems.value);
const playButtonDisabled = computed(
  () => loading.value || items.value.length === 0
);
const hasFilters = computed(() =>
  Object.values(filters.value).some(({ length }) => length > 0)
);
const hasViewTypes = computed(
  () =>
    library.value?.CollectionType === 'movies' ||
    library.value?.CollectionType === 'music' ||
    library.value?.CollectionType === 'tvshows'
);
const isSortable = computed(
  () =>
    viewType.value &&
    /**
     * Not everything is sortable, so depending on what we're showing, we need to hide the sort menu.
     * Reusing this as "isFilterable" too, since these seem to go hand in hand for now.
     */
    ![
      'MusicArtist',
      'Person',
      'Genre',
      'MusicGenre',
      'MusicGenre',
      'Studio'
    ].includes(viewType.value)
);

const recursive = computed(() =>
  library.value?.CollectionType === 'homevideos' ||
  library.value?.Type === 'Folder' ||
  (library.value?.Type === 'CollectionFolder' &&
  !('CollectionType' in library.value))
    ? undefined
    : true
);

/**
 * Fetch the library information when it's changed
 */
async function fetchLibrary(itemId: string): Promise<void> {
  loadingLibrary.value = true;

  try {
    library.value =
      (
        await remote.sdk.newUserApi(getItemsApi).getItems({
          userId: remote.auth.currentUserId,
          ids: [itemId]
        })
      ).data?.Items?.[0] ?? undefined;
  } catch (error) {
    console.error(error);
    useSnackbar(t('failedToRefreshItems'), 'error');
  } finally {
    loadingLibrary.value = false;
  }

  /**
   * Reset all filters and display views since they may not be applicable to the new library
   */
  viewType.value = undefined;
  sortBy.value = undefined;
  sortAscending.value = true;
  filters.value = {
    status: [],
    features: [],
    genres: [],
    ratings: [],
    types: [],
    years: []
  };
}

/**
 * Refresh the items displayed based on filter changes
 */
async function refreshItems(): Promise<void> {
  loadingItems.value = true;

  const parentId = library.value?.Id;
  const userId = remote.auth.currentUserId;

  if (isNil(parentId) || !viewType.value) {
    return;
  }

  try {
    let itemsResponse;

    switch (viewType.value) {
      case 'MusicArtist': {
        itemsResponse = (
          await remote.sdk.newUserApi(getArtistsApi).getAlbumArtists({
            userId,
            parentId
          })
        ).data;
        break;
      }
      case 'Person': {
        itemsResponse = (
          await remote.sdk.newUserApi(getPersonsApi).getPersons({
            userId,
            personTypes: ['Actor']
            // TODO: this doesn't actually filter by library id because that's not an option
          })
        ).data;
        break;
      }
      case 'Genre': {
        itemsResponse = (
          await remote.sdk.newUserApi(getGenresApi).getGenres({
            userId,
            parentId
          })
        ).data;
        break;
      }
      case 'MusicGenre': {
        itemsResponse = (
          await remote.sdk.newUserApi(getMusicGenresApi).getMusicGenres({
            userId,
            parentId
          })
        ).data;
        break;
      }
      case 'Studio': {
        itemsResponse = (
          await remote.sdk.newUserApi(getStudiosApi).getStudios({
            userId,
            parentId
          })
        ).data;
        break;
      }
      default: {
        itemsResponse = (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            userId,
            parentId,
            includeItemTypes: viewType.value ? [viewType.value] : undefined,
            sortOrder: [sortAscending.value ? 'Ascending' : 'Descending'],
            sortBy: [sortBy.value ?? 'SortName'],
            recursive: recursive.value,
            filters: filters.value.status,
            genres: filters.value.genres,
            years: filters.value.years,
            officialRatings: filters.value.ratings,
            hasSubtitles:
              filters.value.features.includes('HasSubtitles') || undefined,
            hasTrailer:
              filters.value.features.includes('HasTrailer') || undefined,
            hasSpecialFeature:
              filters.value.features.includes('HasSpecialFeature') || undefined,
            hasThemeSong:
              filters.value.features.includes('HasThemeSong') || undefined,
            hasThemeVideo:
              filters.value.features.includes('HasThemeVideo') || undefined,
            isHd: filters.value.types.includes('isHD') || undefined,
            is4K: filters.value.types.includes('is4K') || undefined,
            is3D: filters.value.types.includes('is3D') || undefined,
            fields: Object.values(ItemFields)
          })
        ).data;
        break;
      }
    }

    items.value = itemsResponse.Items ?? [];
  } catch (error) {
    items.value = [];
    console.error(error);
    useSnackbar(t('failedToRefreshItems'), 'error');
  } finally {
    loadingItems.value = false;
  }
}

onMounted(() => fetchLibrary((route.params.itemId)));

watch(library, (lib) => {
  route.meta.title = lib?.Name;
});

watch(
  () => library.value?.CollectionType,
  (type) => {
    viewType.value = type ? COLLECTION_TYPES_MAPPINGS[type] : undefined;
  }
);

watch([library, sortBy, sortAscending, viewType, filters], refreshItems, {
  immediate: true
});
</script>

<style lang="scss" scoped>
.empty-card-container {
  max-height: 90vh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
}

.empty-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
