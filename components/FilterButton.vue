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
        <v-expansion-panel-content>
          <v-form v-for="(filter, index) in item.items" :key="index">
            <v-checkbox
              v-model="filter.selected"
              class="my-0"
              :label="filter.label"
              :value="filter.value"
              :true-value="true"
              :false-value="false"
              @change="$emit('input', filters)"
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

interface FilterItem {
  label: string;
  value: string;
  selected: boolean;
}

export default Vue.extend({
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedFilters: this.value,
      filters: {
        filters: {
          header: 'Filters',
          items: [
            { label: 'Played', value: 'IsPlayed', selected: false },
            { label: 'Unplayed', value: 'IsUnPlayed', selected: false },
            {
              label: 'Resumable',
              value: 'IsResumable',
              selected: false
            },
            { label: 'Favorite', value: 'IsFavorite', selected: false },
            { label: 'Likes', value: 'Likes', selected: false },
            { label: 'Dislikes', value: 'Dislikes', selected: false }
          ] as FilterItem[]
        },
        features: {
          header: 'Features',
          items: [
            {
              label: 'Subtitles',
              value: 'hasSubtitles',
              selected: false
            },
            { label: 'Trailer', value: 'hasTrailer', selected: false },
            {
              label: 'Special Features',
              value: 'hasSpecialFeature',
              selected: false
            },
            {
              label: 'Theme Song',
              value: 'hasThemeSong',
              selected: false
            },
            {
              label: 'Theme Video',
              value: 'hasThemeVideo',
              selected: false
            }
          ] as FilterItem[]
        },
        genres: {
          header: 'Genres',
          items: [] as FilterItem[]
        },
        officialRatings: {
          header: 'Parental Ratings',
          items: [] as FilterItem[]
        },
        videoTypes: {
          header: 'Video Types',
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
          header: 'Years',
          items: [] as FilterItem[]
        }
      }
    };
  },
  methods: {
    async getFilters() {
      try {
        const collectionInfo = await this.$api.items.getItems({
          uId: this.$auth.user.Id,
          userId: this.$auth.user.Id,
          ids: this.$route.params.viewId
        });

        const options = {
          userId: this.$auth.user.Id,
          parentId: this.$route.params.viewId,
          includeItemTypes: ''
        };

        if (!collectionInfo.data.Items) {
          return;
        }
        if (collectionInfo.data.Items) {
          options.includeItemTypes = 'sike';
        }
        if (collectionInfo.data.Items[0].CollectionType === 'tvshows') {
          options.includeItemTypes = 'Series';
        } else if (collectionInfo.data.Items[0].CollectionType === 'movies') {
          options.includeItemTypes = 'Movie';
        } else if (collectionInfo.data.Items[0].CollectionType === 'books') {
          options.includeItemTypes = 'Book';
        }

        const result = await this.$api.filter.getQueryFiltersLegacy(options);
        if (!result.data.Genres) {
          return;
        }

        this.filters.genres.items = result.data.Genres.map((x) => ({
          label: x,
          value: x,
          selected: false
        }));

        if (!result.data.OfficialRatings) {
          return;
        }
        this.filters.officialRatings.items = result.data.OfficialRatings.map(
          (x) => ({
            label: x,
            value: x,
            selected: false
          })
        );

        if (!result.data.Years) {
          return;
        }
        this.filters.years.items = result.data.Years.map((x) => ({
          label: x.toString(),
          value: x.toString(),
          selected: false
        }));
      } catch (error) {
        this.$nuxt.error({
          statusCode: 404,
          message: this.$t('filtersNotFound') as string
        });
      }
    }
  }
});
</script>
