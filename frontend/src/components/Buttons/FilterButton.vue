<template>
  <v-menu :offset-y="true" :close-on-content-click="false" max-width="250px">
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.display.smAndDown"
        :disabled="disabled"
        class="ma-2"
        variant="text"
        rounded
        v-bind="attrs"
        v-on="on">
        {{ $t('filter') }}
        <v-icon end>mdi-menu-down</v-icon>
      </v-btn>
      <v-btn
        v-else
        :disabled="disabled"
        class="my-2"
        icon
        v-bind="attrs"
        v-on="on">
        <v-icon>mdi-filter-variant</v-icon>
      </v-btn>
    </template>
    <v-expansion-panels accordion flat focusable class="dropdown">
      <v-expansion-panel :title="$t('status')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedStatusFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(status, statusIndex) in statusFilters"
              :key="`status-${statusIndex}`">
              <v-list-item :value="status.name">
                <template #default="{ active }">
                  <v-list-item-title v-text="status.label" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
        :title="$t('features')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedFeatureFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(feature, featureIndex) in featureFilters"
              :key="`feature-${featureIndex}`">
              <v-list-item :value="feature.name">
                <template #default="{ active }">
                  <v-list-item-title v-text="feature.label" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
      <v-expansion-panel v-if="genreFilters.length > 0" :title="$t('genres')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedGenreFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(genre, genreIndex) in genreFilters"
              :key="`genre-${genreIndex}`">
              <v-list-item :value="genre">
                <template #default="{ active }">
                  <v-list-item-title v-text="genre" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="ratingFilters.length > 0"
        :title="$t('parentalRatings')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedRatingFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(rating, ratingIndex) in ratingFilters"
              :key="`rating-${ratingIndex}`">
              <v-list-item :value="rating">
                <template #default="{ active }">
                  <v-list-item-title v-text="rating" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
        :title="$t('videoTypes')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedTypeFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(type, typeIndex) in typeFilters"
              :key="`type-${typeIndex}`">
              <v-list-item :value="type.name">
                <template #default="{ active }">
                  <v-list-item-title v-text="type.label" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
      <v-expansion-panel v-if="yearFilters.length > 0" :title="$t('years')">
        <v-list dense class="filter-content">
          <v-list-group
            v-model="selectedYearFilters"
            multiple
            @change="emitFilterChange">
            <template
              v-for="(year, yearIndex) in yearFilters"
              :key="`year-${yearIndex}`">
              <v-list-item :value="year">
                <template #default="{ active }">
                  <v-list-item-title v-text="year" />

                  <v-list-item-action>
                    <v-checkbox :model-value="active" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </template>
          </v-list-group>
        </v-list>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemDto, ItemFilter } from '@jellyfin/sdk/lib/generated-client';
import { sanitizeHtml } from '~/utils/html';
import { useSnackbar } from '@/composables';

export default defineComponent({
  props: {
    collectionInfo: {
      type: Object as () => BaseItemDto,
      required: true
    },
    itemsType: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      statusFilters: [
        {
          label: this.$t('played'),
          name: ItemFilter.IsPlayed
        },
        {
          label: this.$t('unplayed'),
          name: ItemFilter.IsUnplayed
        },
        {
          label: this.$t('resumable'),
          name: ItemFilter.IsResumable
        },
        {
          label: this.$t('favorite'),
          name: ItemFilter.IsFavorite
        },
        { label: this.$t('liked'), name: ItemFilter.Likes },
        { label: this.$t('unliked'), name: ItemFilter.Dislikes }
      ],
      selectedStatusFilters: [],
      featureFilters: [
        {
          label: this.$t('subtitles'),
          name: 'HasSubtitles'
        },
        { label: this.$t('trailer'), value: 'hasTrailer' },
        {
          label: this.$t('specialFeatures'),
          name: 'HasSpecialFeature'
        },
        {
          label: this.$t('themeSong'),
          name: 'HasThemeSong'
        },
        {
          label: this.$t('themeVideo'),
          name: 'HasThemeVideo'
        }
      ],
      selectedFeatureFilters: [],
      genreFilters: [] as string[],
      selectedGenreFilters: [],
      ratingFilters: [] as string[],
      selectedRatingFilters: [],
      typeFilters: [
        { label: 'Blu-Ray', name: 'Bluray' },
        { label: 'DVD', name: 'Dvd' },
        { label: 'HD', name: 'isHD' },
        { label: '4K', name: 'is4K' },
        { label: '3D', name: 'is3D' }
      ],
      selectedTypeFilters: [],
      yearFilters: [] as number[],
      selectedYearFilters: []
    };
  },
  watch: {
    itemsType(): void {
      this.refreshItems();
    }
  },
  methods: {
    async refreshItems(): Promise<void> {
      try {
        /**
         * Sanitization of route params to avoid XSS injection attacks.
         *
         * First reported on https://github.com/jellyfin/jellyfin-vue/security/code-scanning/223
         */
        const response = (
          await this.$api.filter.getQueryFiltersLegacy({
            userId: this.$remote.auth.currentUserId.value,
            parentId: sanitizeHtml(this.$route.params.viewId),
            includeItemTypes: [this.itemsType]
          })
        ).data;

        if (response.Genres) {
          this.genreFilters = response.Genres;
        }

        if (response.OfficialRatings) {
          this.ratingFilters = response.OfficialRatings;
        }

        if (response.Years) {
          this.yearFilters = response.Years;
        }
      } catch {
        this.useSnackbar(this.$t('filtersNotFound'), 'error');
      }
    },
    emitFilterChange(): void {
      this.$emit('change', {
        status: this.selectedStatusFilters,
        features: this.selectedFeatureFilters,
        genres: this.selectedGenreFilters,
        ratings: this.selectedRatingFilters,
        types: this.selectedTypeFilters,
        years: this.selectedYearFilters
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.filter-content {
  max-height: 15rem;
}

.dropdown {
  overflow-y: scroll;
}
</style>
