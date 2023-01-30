<template>
  <v-menu :close-on-content-click="false" max-width="250px">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-if="!$vuetify.display.smAndDown"
        class="ma-2"
        variant="text"
        rounded
        v-bind="mergeProps(menuProps, props)">
        {{ $t('filter') }}
        <v-icon end>
          <i-mdi-menu-down />
        </v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="mergeProps(menuProps, props)">
        <v-icon>
          <i-mdi-filter-variant />
        </v-icon>
      </v-btn>
    </template>
    <v-expansion-panels variant="accordion" class="dropdown">
      <v-expansion-panel :title="$t('status')">
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
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
        :title="$t('features')">
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
      <v-expansion-panel v-if="genreFilters.length > 0" :title="$t('genres')">
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
        :title="$t('parentalRatings')">
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
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
        :title="$t('videoTypes')">
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
      <v-expansion-panel v-if="yearFilters.length > 0" :title="$t('years')">
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
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref, watch, mergeProps } from 'vue';
import { useRoute } from 'vue-router';
import {
  BaseItemDto,
  BaseItemKind,
  ItemFilter
} from '@jellyfin/sdk/lib/generated-client';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { sanitizeHtml } from '@/utils/html';
import { useRemote, useSnackbar } from '@/composables';

const route = useRoute();
const remote = useRemote();
const { t } = useI18n();
const emit = defineEmits<{
  (e: 'change', filters: Record<string, string[]>): void;
}>();

const props = defineProps<{
  collectionInfo: BaseItemDto;
  itemsType: BaseItemKind;
  disabled?: boolean;
}>();

const selectedFeatureFilters = ref([]);
const selectedGenreFilters = ref([]);
const selectedRatingFilters = ref([]);
const selectedStatusFilters = ref([]);
const selectedTypeFilters = ref([]);
const selectedYearFilters = ref([]);
const ratingFilters = ref<string[]>([]);
const genreFilters = ref<string[]>([]);
const yearFilters = ref<number[]>([]);

const statusFilters = computed(() => [
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

const featureFilters = computed(() => [
  {
    label: t('subtitles'),
    name: 'HasSubtitles'
  },
  { label: t('trailer'), value: 'hasTrailer' },
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
]);

const typeFilters = [
  { label: 'Blu-Ray', name: 'Bluray' },
  { label: 'DVD', name: 'Dvd' },
  { label: 'HD', name: 'isHD' },
  { label: '4K', name: 'is4K' },
  { label: '3D', name: 'is3D' }
];

/**
 * refesh the list of items that are displayed in the grid,
 * applying filters and sorting
 */
async function refreshItems(): Promise<void> {
  try {
    /**
     * Sanitization of route params to avoid XSS injection attacks.
     *
     * First reported on https://github.com/jellyfin/jellyfin-vue/security/code-scanning/223
     */
    const response = (
      await remote.sdk.newUserApi(getFilterApi).getQueryFiltersLegacy({
        userId: remote.auth.currentUserId,
        // @ts-expect-error - We don't have typings for routes - TODO: Fix
        parentId: sanitizeHtml(route.params.viewId),
        includeItemTypes: [props.itemsType]
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
watch(
  () => props.itemsType,
  () => {
    refreshItems();
  }
);
</script>

<style lang="scss" scoped>
.filter-content {
  max-height: 15rem;
}

.dropdown {
  overflow-y: scroll;
}
</style>
