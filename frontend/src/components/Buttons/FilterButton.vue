<template>
  <v-btn class="ma-2" :icon="$vuetify.display.smAndDown">
    {{ !$vuetify.display.smAndDown ? t('filter') : undefined }}
    <v-icon :end="!$vuetify.display.smAndDown">
      <i-mdi-menu-down v-if="!$vuetify.display.smAndDown" />
      <i-mdi-filter-variant v-else />
    </v-icon>
    <v-menu
      :disabled="disabled"
      :close-on-content-click="false"
      max-width="250px">
      <v-expansion-panels variant="accordion" class="dropdown">
        <v-expansion-panel :title="t('status')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedStatusFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(status, statusIndex) in statusFilters"
                :key="`status-${statusIndex}`">
                <v-list-item :value="status.name" :title="status.label">
                  <template #append="{ isActive }">
                    <v-list-item-action end>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isMovieOrTvShow" :title="t('features')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedFeatureFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(feature, featureIndex) in featureFilters"
                :key="`feature-${featureIndex}`">
                <v-list-item :value="feature.name" :title="feature.label">
                  <template #append="{ isActive }">
                    <v-list-item-action end>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="genreFilters.length > 0" :title="t('genres')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedGenreFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(genre, genreIndex) in genreFilters"
                :key="`genre-${genreIndex}`">
                <v-list-item :value="genre" :title="genre">
                  <template #append="{ isActive }">
                    <v-list-item-action>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel
          v-if="ratingFilters.length > 0"
          :title="t('parentalRatings')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedRatingFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(rating, ratingIndex) in ratingFilters"
                :key="`rating-${ratingIndex}`">
                <v-list-item :value="rating" :title="rating">
                  <template #append="{ isActive }">
                    <v-list-item-action>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="isMovieOrTvShow" :title="t('videoTypes')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedTypeFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(type, typeIndex) in typeFilters"
                :key="`type-${typeIndex}`">
                <v-list-item :value="type.name" :title="type.label">
                  <template #append="{ isActive }">
                    <v-list-item-action>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="yearFilters.length > 0" :title="t('years')">
          <v-expansion-panel-text>
            <v-list
              v-model:selected="selectedYearFilters"
              select-strategy="leaf"
              class="filter-content"
              @update:selected="emitFilterChange">
              <template
                v-for="(year, yearIndex) in yearFilters"
                :key="`year-${yearIndex}`">
                <v-list-item :value="year" :title="year">
                  <template #append="{ isActive }">
                    <v-list-item-action>
                      <v-checkbox-btn :model-value="isActive" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import { BaseItemDto, ItemFilter } from '@jellyfin/sdk/lib/generated-client';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { useRemote, useSnackbar } from '@/composables';

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
  (e: 'change', filters: Filters): void;
}>();

const remote = useRemote();
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
    props.item.CollectionType === 'movies' ||
    props.item.CollectionType === 'tvshows'
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

<style lang="scss" scoped>
.filter-content {
  max-height: 15rem;
}

.dropdown {
  overflow-y: scroll;
}
</style>
