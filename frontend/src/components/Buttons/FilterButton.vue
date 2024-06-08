<template>
  <VBtn
    class="ma-2"
    :icon="$vuetify.display.smAndDown">
    {{ !$vuetify.display.smAndDown ? t('filter') : undefined }}
    <VIcon :end="!$vuetify.display.smAndDown">
      <IMdiMenuDown v-if="!$vuetify.display.smAndDown" />
      <IMdiFilterVariant v-else />
    </VIcon>
    <VMenu
      :disabled="disabled"
      :close-on-content-click="false"
      max-width="250px">
      <VExpansionPanels
        variant="accordion"
        class="dropdown">
        <VExpansionPanel :title="t('status')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedStatusFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(status, statusIndex) in statusFilters"
                :key="`status-${statusIndex}`">
                <VListItem
                  :value="status.name"
                  :title="status.label">
                  <template #append="{ isActive }">
                    <VListItemAction end>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
        <VExpansionPanel
          v-if="isMovieOrTvShow"
          :title="t('features')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedFeatureFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(feature, featureIndex) in featureFilters"
                :key="`feature-${featureIndex}`">
                <VListItem
                  :value="feature.name"
                  :title="feature.label">
                  <template #append="{ isActive }">
                    <VListItemAction end>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
        <VExpansionPanel
          v-if="genreFilters.length"
          :title="t('genres')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedGenreFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(genre, genreIndex) in genreFilters"
                :key="`genre-${genreIndex}`">
                <VListItem
                  :value="genre"
                  :title="genre">
                  <template #append="{ isActive }">
                    <VListItemAction>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
        <VExpansionPanel
          v-if="ratingFilters.length"
          :title="t('parentalRatings')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedRatingFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(rating, ratingIndex) in ratingFilters"
                :key="`rating-${ratingIndex}`">
                <VListItem
                  :value="rating"
                  :title="rating">
                  <template #append="{ isActive }">
                    <VListItemAction>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
        <VExpansionPanel
          v-if="isMovieOrTvShow"
          :title="t('videoTypes')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedTypeFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(type, typeIndex) in typeFilters"
                :key="`type-${typeIndex}`">
                <VListItem
                  :value="type.name"
                  :title="type.label">
                  <template #append="{ isActive }">
                    <VListItemAction>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
        <VExpansionPanel
          v-if="yearFilters.length"
          :title="t('years')">
          <VExpansionPanelText>
            <VList
              v-model:selected="selectedYearFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(year, yearIndex) in yearFilters"
                :key="`year-${yearIndex}`">
                <VListItem
                  :value="year"
                  :title="year">
                  <template #append="{ isActive }">
                    <VListItemAction>
                      <VCheckboxBtn :model-value="isActive" />
                    </VListItemAction>
                  </template>
                </VListItem>
              </template>
            </VList>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { type BaseItemDto, ItemFilter } from '@jellyfin/sdk/lib/generated-client';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { remote } from '@/plugins/remote';
import { useSnackbar } from '@/composables/use-snackbar';

export type FeatureFilters =
  | 'HasSubtitles'
  | 'HasTrailer'
  | 'HasSpecialFeature'
  | 'HasThemeSong'
  | 'HasThemeVideo';

export type TypeFilters = 'Bluray' | 'Dvd' | 'isHD' | 'is4K' | 'is3D';

export interface Filters {
  features: FeatureFilters[];
  status: ItemFilter[];
  genres: string[];
  ratings: string[];
  types: TypeFilters[];
  years: number[];
}

const props = defineProps<{
  item: BaseItemDto;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [filters: Filters];
}>();

const { t } = useI18n();

const selectedFeatureFilters = ref<FeatureFilters[]>([]);
const selectedGenreFilters = ref<string[]>([]);
const selectedRatingFilters = ref<string[]>([]);
const selectedStatusFilters = ref<ItemFilter[]>([]);
const selectedTypeFilters = ref<TypeFilters[]>([]);
const selectedYearFilters = ref<number[]>([]);
const ratingFilters = ref<string[]>([]);
const genreFilters = ref<string[]>([]);
const yearFilters = ref<number[]>([]);

const isMovieOrTvShow = computed(
  () =>
    props.item.CollectionType === 'movies'
    || props.item.CollectionType === 'tvshows'
);

const statusFilters = computed<{ label: string; name: ItemFilter }[]>(() => [
  {
    label: t('played'),
    name: ItemFilter.IsPlayed
  },
  {
    label: t('unplayed'),
    name: ItemFilter.IsUnplayed
  },
  {
    label: t('resumable'),
    name: ItemFilter.IsResumable
  },
  {
    label: t('favorite'),
    name: ItemFilter.IsFavorite
  },
  { label: t('liked'), name: ItemFilter.Likes },
  { label: t('unliked'), name: ItemFilter.Dislikes }
]);

const featureFilters = computed(
  (): { label: string; name: FeatureFilters }[] => [
    {
      label: t('subtitles'),
      name: 'HasSubtitles'
    },
    {
      label: t('trailer'),
      name: 'HasTrailer'
    },
    {
      label: t('specialFeatures'),
      name: 'HasSpecialFeature'
    },
    {
      label: t('themeSong'),
      name: 'HasThemeSong'
    },
    {
      label: t('themeVideo'),
      name: 'HasThemeVideo'
    }
  ]
);

const typeFilters: { label: string; name: TypeFilters }[] = [
  { label: 'Blu-Ray', name: 'Bluray' },
  { label: 'DVD', name: 'Dvd' },
  { label: 'HD', name: 'isHD' },
  { label: '4K', name: 'is4K' },
  { label: '3D', name: 'is3D' }
];

/**
 * Refresh the list of items that are displayed in the grid,
 * applying filters and sorting
 */
async function refreshItems(): Promise<void> {
  if (!props.item.Id || !props.item.Type) {
    return;
  }

  try {
    const response = (
      await remote.sdk.newUserApi(getFilterApi).getQueryFiltersLegacy({
        userId: remote.auth.currentUserId,
        parentId: props.item.Id,
        includeItemTypes: [props.item.Type]
      })
    ).data;

    if (response.Genres) {
      genreFilters.value = response.Genres;
    }

    if (response.OfficialRatings) {
      ratingFilters.value = response.OfficialRatings;
    }

    if (response.Years) {
      yearFilters.value = response.Years;
    }
  } catch {
    useSnackbar(t('filtersNotFound'), 'error');
  }
}
/**
 * Pass on change event to parent component
 */
function emitFilterChange(): void {
  emit('change', {
    status: selectedStatusFilters.value,
    features: selectedFeatureFilters.value,
    genres: selectedGenreFilters.value,
    ratings: selectedRatingFilters.value,
    types: selectedTypeFilters.value,
    years: selectedYearFilters.value
  });
}
watch(() => props.item, refreshItems);
</script>

<style scoped>
.filter-content {
  max-height: 15rem;
}

.dropdown {
  overflow-y: scroll;
}
</style>
