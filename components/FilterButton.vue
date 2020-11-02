<template>
  <v-menu :offset-y="true" :close-on-content-click="false" max-width="250px">
    <template v-slot:activator="{ on }">
      <v-btn class="ma-2" icon v-on="on" @click="getFilters">
        <v-icon>mdi-filter-variant</v-icon>
      </v-btn>
    </template>
    <v-expansion-panels accordion>
      <v-expansion-panel v-for="item in filters" :key="item.header">
        <v-expansion-panel-header>{{ item.header }}</v-expansion-panel-header>
        <v-expansion-panel-content class="filter-content">
          <v-form v-for="(filter, index) in item.items" :key="index">
            <v-checkbox
              v-model="filter.selected"
              class="my-0"
              :label="filter.label"
              :value="filter.value"
              :true-value="true"
              :false-value="false"
              @change="emitFiltersOptions"
            >
            </v-checkbox>
          </v-form>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { ItemsApiGetItemsRequest } from '~/api';

interface FilterItem {
  label: string;
  value: string;
  selected: boolean;
}

export default Vue.extend({
  props: {
    collectionInfoItem: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      filters: {
        status: {
          header: this.$t('status'),
          items: [
            { label: this.$t('played'), value: 'IsPlayed', selected: false },
            {
              label: this.$t('unplayed'),
              value: 'IsUnPlayed',
              selected: false
            },
            {
              label: this.$t('resumable'),
              value: 'IsResumable',
              selected: false
            },
            {
              label: this.$t('favorite'),
              value: 'IsFavorite',
              selected: false
            },
            { label: this.$t('likes'), value: 'Likes', selected: false },
            { label: this.$t('dislikes'), value: 'Dislikes', selected: false }
          ] as FilterItem[]
        },
        features: {
          header: this.$t('features'),
          items: [
            {
              label: this.$t('subtitles'),
              value: 'hasSubtitles',
              selected: false
            },
            { label: this.$t('trailer'), value: 'hasTrailer', selected: false },
            {
              label: this.$t('specialFeatures'),
              value: 'hasSpecialFeature',
              selected: false
            },
            {
              label: this.$t('themeSong'),
              value: 'hasThemeSong',
              selected: false
            },
            {
              label: this.$t('themeVideo'),
              value: 'hasThemeVideo',
              selected: false
            }
          ] as FilterItem[]
        },
        genres: {
          header: this.$t('genres'),
          items: [] as FilterItem[]
        },
        officialRatings: {
          header: this.$t('parentalRatings'),
          items: [] as FilterItem[]
        },
        videoTypes: {
          header: this.$t('videoTypes'),
          items: [
            { label: 'Blu-Ray', value: 'Bluray', selected: false },
            { label: 'DVD', value: 'Dvd', selected: false },
            { label: 'SD', value: 'isHD', selected: false },
            { label: 'HD', value: 'isHD', selected: false },
            { label: '4K', value: 'is4K', selected: false },
            { label: '3D', value: 'is3D', selected: false }
          ] as FilterItem[]
        },
        years: {
          header: this.$t('years'),
          items: [] as FilterItem[]
        }
      },
      selectedFilters: {}
    };
  },
  computed: {
    itemType() {
      if (this.collectionInfoItem.CollectionType === 'tvshows') {
        return 'Series';
      } else if (this.collectionInfoItem.CollectionType === 'movies') {
        return 'Movie';
      } else if (this.collectionInfoItem.CollectionType === 'books') {
        return 'Book';
      }
      return '';
    }
  },
  methods: {
    async getFilters() {
      try {
        if (this.itemType === '') {
          return;
        }

        const response = (
          await this.$api.filter.getQueryFiltersLegacy({
            userId: this.$auth.user.Id,
            parentId: this.$route.params.viewId,
            includeItemTypes: this.itemType
          })
        ).data;

        if (response.Genres) {
          this.filters.genres.items = response.Genres.map((x) => ({
            label: x,
            value: x,
            selected: false
          }));
        }

        if (response.OfficialRatings) {
          this.filters.officialRatings.items = response.OfficialRatings.map(
            (x) => ({
              label: x,
              value: x,
              selected: false
            })
          );
        }

        if (response.Years) {
          this.filters.years.items = response.Years.map((x) => ({
            label: x.toString(),
            value: x.toString(),
            selected: false
          }));
        }
      } catch (error) {
        this.$nuxt.error({
          statusCode: 404,
          message: this.$t('filtersNotFound') as string
        });
      }
    },
    emitFiltersOptions() {
      try {
        if (
          this.collectionInfoItem !== {} &&
          (this.collectionInfoItem.Type === 'CollectionFolder' ||
            this.collectionInfoItem.Type === 'Folder')
        ) {
          const statusString = this.makeFilterString(
            this.filters.status.items,
            ','
          );

          const features: { [key: string]: boolean } = {};
          for (const feature of this.filters.features.items) {
            if (!feature.selected) {
              continue;
            }

            features[feature.value] = true;
          }

          const genreString = this.makeFilterString(
            this.filters.genres.items,
            '|'
          );

          const ratingString = this.makeFilterString(
            this.filters.officialRatings.items,
            '|'
          );

          let videoTypeString = '';
          const videoTypesObject: { [key: string]: boolean } = {};
          for (const videoType of this.filters.videoTypes.items) {
            if (!videoType.selected) {
              continue;
            }
            if (videoType.label === 'SD') {
              videoTypesObject.isHd = false;
              continue;
            }
            if (videoType.label === 'HD') {
              videoTypesObject.isHd = true;
              continue;
            }
            if (videoType.label === '4K' || videoType.label === '3D') {
              videoTypesObject[videoType.value] = true;
            } else {
              if (videoTypeString.length > 0) {
                videoTypeString += ',';
              }
              videoTypeString += videoType.value;
            }
          }

          const yearString = this.makeFilterString(
            this.filters.years.items,
            ','
          );

          const options: ItemsApiGetItemsRequest = {
            uId: this.$auth.user.Id,
            userId: this.$auth.user.Id,
            parentId: this.$route.params.viewId,
            includeItemTypes: this.itemType,
            recursive: true,
            filters: statusString,
            genres: genreString,
            officialRatings: ratingString,
            videoTypes: videoTypeString,
            years: yearString
          };
          Object.assign(options, features);
          Object.assign(options, videoTypesObject);

          this.$emit('change', options);
        }
      } catch (error) {
        this.$emit('change', error);
      }
    },
    makeFilterString(filterList: FilterItem[], seperator: string) {
      let filterString = '';
      for (const filter of filterList) {
        if (!filter.selected) {
          continue;
        }
        if (filterString.length > 0) {
          filterString += seperator;
        }
        filterString += filter.value;
      }
      return filterString;
    }
  }
});
</script>
<style scoped>
.filter-content {
  max-height: 15rem;
  overflow: scroll;
}
</style>
