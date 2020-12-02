<template>
  <div>
    <v-app-bar fixed flat dense class="second-toolbar">
      <span class="text-h6 hidden-sm-and-down">
        {{ collectionInfo.Name }}
      </span>
      <v-chip v-if="!loading" small class="ma-2 hidden-sm-and-down">
        {{ itemsCount }}
      </v-chip>
      <v-divider inset vertical class="mx-2 hidden-sm-and-down" />
      <type-button
        v-if="collectionInfo.CollectionType"
        :type="collectionInfo.CollectionType"
        @change="onChangeType"
      />
      <v-divider v-if="isSortable" inset vertical class="mx-2" />
      <sort-button v-if="isSortable" @change="onChangeSort" />
      <filter-button
        v-if="isSortable"
        :collection-info="collectionInfo"
        :items-type="viewType"
        @change="onChangeFilter"
      />
    </v-app-bar>
    <v-container class="after-second-toolbar">
      <item-grid :loading="loading" :items="items">
        <h1 class="text-h5">
          {{ $t('libraryEmpty') }}
        </h1>
      </item-grid>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto } from '~/api';

export default Vue.extend({
  data() {
    return {
      items: [] as BaseItemDto[],
      itemsCount: 0,
      loading: false,
      viewType: '',
      sortBy: 'SortName',
      statusFilter: [],
      genresFilter: [],
      yearsFilter: [],
      ratingsFilter: [],
      filterHasSubtitles: false,
      filterHasTrailer: false,
      filterHasSpecialFeature: false,
      filterHasThemeSong: false,
      filterHasThemeVideo: false,
      filterIsHd: undefined as boolean | undefined,
      filterIs4k: undefined as boolean | undefined,
      filterIs3d: undefined as boolean | undefined,
      collectionInfo: {} as BaseItemDto
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    isSortable() {
      // Not everything is sortable, so depending on what we're showing, we need to hide the sort menu.
      // Reusing this as "isFilterable" too, since these seem to go hand in hand for now.
      if (
        ![
          'MusicArtist',
          'Actor',
          'Genre',
          'MusicGenre',
          'MusicGenre',
          'Studio'
        ].includes(this.viewType)
      ) {
        return true;
      } else {
        return false;
      }
    }
  },
  watch: {
    async viewType() {
      this.loading = true;
      await this.refreshItems();
      this.loading = false;
    },
    async sortBy() {
      this.loading = true;
      await this.refreshItems();
      this.loading = false;
    }
  },
  async beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.$nextTick(() => {
      this.$nuxt.$loading.start();
    });
    try {
      this.loading = true;
      this.collectionInfo = (
        await this.$api.items.getItems({
          uId: this.$auth.user.Id,
          userId: this.$auth.user.Id,
          ids: this.$route.params.viewId
        })
      ).data.Items[0];

      if (
        this.collectionInfo &&
        (this.collectionInfo.Type === 'CollectionFolder' ||
          this.collectionInfo.Type === 'Folder')
      ) {
        if (this.collectionInfo.Name) {
          this.setPageTitle({
            title: this.collectionInfo.Name
          });
        }

        // Set default view type - This will trigger an items refresh
        switch (this.collectionInfo.CollectionType) {
          case 'tvshows':
            this.viewType = 'Series';
            break;
          case 'movies':
            this.viewType = 'Movie';
            break;
          case 'books':
            this.viewType = 'Book';
            break;
          case 'music':
            this.viewType = 'MusicAlbum';
            break;
          default:
            break;
        }

        this.$nuxt.$loading.finish();
      }
    } catch (error) {
      // Can't get given library ID
      this.$nuxt.error({
        statusCode: 404,
        message: this.$t('libraryNotFound') as string
      });
    }
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    onChangeType(type: string) {
      this.viewType = type;
    },
    onChangeSort(sort: string) {
      this.sortBy = sort;
    },
    onChangeFilter(filter: Record<string, any>) {
      this.genresFilter = filter.genres;
      this.statusFilter = filter.status;
      this.yearsFilter = filter.years;
      this.ratingsFilter = filter.ratings;
      this.filterHasSubtitles = filter.features.includes('HasSubtitles');
      this.filterHasTrailer = filter.features.includes('HasTrailer');
      this.filterHasSpecialFeature = filter.features.includes(
        'HasSpecialFeature'
      );
      this.filterHasThemeSong = filter.features.includes('HasThemeSong');
      this.filterHasThemeVideo = filter.features.includes('HasThemeVideo');

      // The following technically have a "false" state for excluding them.
      // TODO: Maybe add exclusion to the filters
      if (filter.types.includes('isHD')) {
        this.filterIsHd = true;
      } else {
        this.filterIsHd = undefined;
      }

      if (filter.types.includes('is4K')) {
        this.filterIs4k = true;
      } else {
        this.filterIs4k = undefined;
      }

      if (filter.types.includes('is3D')) {
        this.filterIs3d = true;
      } else {
        this.filterIs3d = undefined;
      }

      this.refreshItems();
    },
    async refreshItems() {
      try {
        let itemsResponse;
        switch (this.viewType) {
          case 'MusicArtist':
            itemsResponse = (
              await this.$api.artists.getAlbumArtists({
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'Actor':
            itemsResponse = (
              await this.$api.persons.getPersons({
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId,
                personTypes: 'Actor'
              })
            ).data;
            break;
          case 'Genre':
            itemsResponse = (
              await this.$api.genres.getGenres({
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'MusicGenre':
            itemsResponse = (
              await this.$api.musicGenres.getMusicGenres({
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'Studio':
            itemsResponse = (
              await this.$api.studios.getStudios({
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          default:
            itemsResponse = (
              await this.$api.items.getItems({
                uId: this.$auth.user.Id,
                userId: this.$auth.user.Id,
                parentId: this.$route.params.viewId,
                includeItemTypes: this.viewType,
                recursive: true,
                sortBy: this.sortBy,
                sortOrder: 'Ascending',
                filters: this.statusFilter ? this.statusFilter : undefined,
                genres: this.genresFilter ? this.genresFilter : undefined,
                years: this.yearsFilter ? this.yearsFilter : undefined,
                officialRatings: this.ratingsFilter
                  ? this.ratingsFilter
                  : undefined,
                hasSubtitles: this.filterHasSubtitles ? true : undefined,
                hasTrailer: this.filterHasTrailer ? true : undefined,
                hasSpecialFeature: this.filterHasSpecialFeature
                  ? true
                  : undefined,
                hasThemeSong: this.filterHasThemeSong ? true : undefined,
                hasThemeVideo: this.filterHasThemeVideo ? true : undefined,
                isHd: this.filterIsHd ? true : undefined,
                is4K: this.filterIs4k ? true : undefined,
                is3D: this.filterIs3d ? true : undefined
              })
            ).data;
            break;
        }

        this.items = itemsResponse.Items;
        this.itemsCount = itemsResponse.TotalRecordCount;
      } catch (error) {
        console.error('Unable to refresh items:', error);
        this.items = [];
        this.itemsCount = 0;
        this.pushSnackbarMessage({
          message: this.$t('failedToRefreshItems'),
          color: 'error'
        });
      }

      this.loading = false;
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';
.second-toolbar {
  top: 56px;
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .second-toolbar {
    top: 64px;
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .second-toolbar {
    left: 256px !important;
  }
}

.after-second-toolbar {
  padding-top: 60px;
}

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
