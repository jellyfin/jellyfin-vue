<template>
  <v-menu :offset-y="true" :close-on-content-click="false" max-width="250px">
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.breakpoint.smAndDown"
        class="ma-2"
        text
        rounded
        v-bind="attrs"
        v-on="on"
      >
        {{ $t('filter') }}
        <v-icon right> mdi-menu-down </v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="attrs" v-on="on">
        <v-icon>mdi-filter-variant</v-icon>
      </v-btn>
    </template>
    <v-expansion-panels accordion flat focusable>
      <v-expansion-panel>
        <v-expansion-panel-header>{{ $t('status') }}</v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedStatusFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(status, statusIndex) in statusFilters">
                <v-list-item
                  :key="`status-${statusIndex}`"
                  :value="status.name"
                >
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title
                        v-text="status.label"
                      ></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
      >
        <v-expansion-panel-header>
          {{ $t('features') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedFeatureFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(feature, featureIndex) in featureFilters">
                <v-list-item
                  :key="`feature-${featureIndex}`"
                  :value="feature.name"
                >
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title
                        v-text="feature.label"
                      ></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="genreFilters.length > 0">
        <v-expansion-panel-header>{{ $t('genres') }}</v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedGenreFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(genre, genreIndex) in genreFilters">
                <v-list-item :key="`genre-${genreIndex}`" :value="genre">
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title v-text="genre"></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="ratingFilters.length > 0">
        <v-expansion-panel-header>
          {{ $t('parentalRatings') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedRatingFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(rating, ratingIndex) in ratingFilters">
                <v-list-item :key="`rating-${ratingIndex}`" :value="rating">
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title v-text="rating"></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="
          collectionInfo.CollectionType === 'movies' ||
          collectionInfo.CollectionType === 'tvshows'
        "
      >
        <v-expansion-panel-header>
          {{ $t('videoTypes') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedTypeFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(type, typeIndex) in typeFilters">
                <v-list-item :key="`type-${typeIndex}`" :value="type.name">
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title
                        v-text="type.label"
                      ></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="yearFilters.length > 0">
        <v-expansion-panel-header>
          {{ $t('years') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-list dense>
            <v-list-item-group
              v-model="selectedYearFilters"
              multiple
              @change="emitFilterChange"
            >
              <template v-for="(year, yearIndex) in yearFilters">
                <v-list-item :key="`year-${yearIndex}`" :value="year">
                  <template #default="{ active }">
                    <v-list-item-content>
                      <v-list-item-title v-text="year"></v-list-item-title>
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-checkbox :input-value="active"></v-checkbox>
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ItemFilter } from '~/api';

export default Vue.extend({
  props: {
    collectionInfo: {
      type: Object as () => BaseItemDto,
      required: true
    },
    itemsType: {
      type: String,
      required: true
    }
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
    itemsType() {
      this.refreshItems();
    }
  },
  methods: {
    async refreshItems() {
      try {
        const response = (
          await this.$api.filter.getQueryFiltersLegacy({
            userId: this.$auth.user.Id,
            parentId: this.$route.params.viewId,
            includeItemTypes: this.itemsType
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
      } catch (error) {
        console.error('Unable to retrieve filters:', error);
      }
    },
    emitFilterChange() {
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
  overflow: scroll;
}
</style>
