<template>
  <div>
    <v-app-bar fixed flat dense class="second-toolbar">
      <span class="text-h6 hidden-sm-and-down">
        {{ collectionInfo.Name }}
      </span>
      <v-chip :small="!loading" class="ma-2 hidden-sm-and-down">
        <template v-if="!loading">{{ itemsCount }}</template>
        <v-progress-circular v-else width="2" indeterminate size="16" />
      </v-chip>
      <v-divider inset vertical class="mx-2 hidden-sm-and-down" />
      <type-button
        v-if="hasViewTypes"
        :type="collectionInfo.CollectionType"
        :disabled="loading"
        @change="onChangeType"
      />
      <v-divider
        v-if="isSortable && hasViewTypes"
        inset
        vertical
        class="mx-2"
      />
      <sort-button
        v-if="isSortable"
        :disabled="loading || !items.length"
        @change="onChangeSort"
      />
      <filter-button
        v-if="isSortable"
        :collection-info="collectionInfo"
        :disabled="loading || (!items.length && !hasFilters)"
        :items-type="viewType"
        @change="onChangeFilter"
      />
      <v-spacer />
      <play-button :item="collectionInfo" shuffle />
      <play-button :item="collectionInfo" />
    </v-app-bar>
    <v-container class="after-second-toolbar">
      <skeleton-item-grid v-if="loading" :view-type="viewType" />
      <item-grid :loading="loading" :items="items">
        <h1 v-if="!hasFilters && isDefaultView" class="text-h5">
          {{ hasFilters ? $t('libraryEmptyFilters') : $t('libraryEmpty') }}
        </h1>
      </item-grid>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { isValidMD5, validLibraryTypes } from '~/utils/items';

export default Vue.extend({
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.viewId);
  },
  async asyncData({ params, $api, $auth }) {
    const collectionInfo = (
      await $api.items.getItems({
        userId: $auth.user?.Id,
        ids: [params.viewId]
      })
    ).data?.Items?.[0];

    return { collectionInfo };
  },
  data() {
    return {
      items: [] as BaseItemDto[],
      itemsCount: 0,
      loading: false,
      viewType: '',
      sortBy: 'SortName',
      hasFilters: false,
      isDefaultView: true, // Movie view, not Collection. Music view, not Genres...
      statusFilter: [] as string[],
      genresFilter: [] as string[],
      yearsFilter: [] as string[],
      ratingsFilter: [] as string[],
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
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title']),
    hasViewTypes(): boolean {
      if (
        ['homevideos'].includes(this.collectionInfo.CollectionType || '') ||
        this.collectionInfo.CollectionType === undefined
      ) {
        return false;
      } else {
        return true;
      }
    },
    isSortable(): boolean {
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
    async viewType(): Promise<void> {
      await this.refreshItems();
    },
    async sortBy(): Promise<void> {
      await this.refreshItems();
    }
  },
  async mounted() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.$nextTick(() => {
      this.$nuxt.$loading.start();
    });

    if (
      this.collectionInfo?.Type &&
      validLibraryTypes.includes(this.collectionInfo.Type)
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
          await this.refreshItems();
          break;
      }

      this.$nextTick(() => {
        this.$nuxt.$loading.finish();
      });
    }
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    onChangeType(type: string): void {
      const defaultViews = ['Series', 'Movie', 'Book', 'MusicAlbum'];

      this.viewType = type;
      this.isDefaultView = defaultViews.includes(this.viewType);
    },
    onChangeSort(sort: string): void {
      this.sortBy = sort;
    },
    onChangeFilter(filter: Record<string, [string]>): boolean | void {
      this.hasFilters = Object.values(filter).some((value) => {
        return value.length > 0;
      });

      this.genresFilter = filter.genres;
      this.statusFilter = filter.status;
      this.yearsFilter = filter.years;
      this.ratingsFilter = filter.ratings;
      this.filterHasSubtitles = filter.features.includes('HasSubtitles');
      this.filterHasTrailer = filter.features.includes('HasTrailer');
      this.filterHasSpecialFeature =
        filter.features.includes('HasSpecialFeature');
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
    async refreshItems(): Promise<void> {
      this.loading = true;

      try {
        let itemsResponse;

        switch (this.viewType) {
          case 'MusicArtist':
            itemsResponse = (
              await this.$api.artists.getAlbumArtists({
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'Actor':
            itemsResponse = (
              await this.$api.persons.getPersons({
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId,
                personTypes: 'Actor'
              })
            ).data;
            break;
          case 'Genre':
            itemsResponse = (
              await this.$api.genres.getGenres({
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'MusicGenre':
            itemsResponse = (
              await this.$api.musicGenres.getMusicGenres({
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          case 'Studio':
            itemsResponse = (
              await this.$api.studios.getStudios({
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          default:
            itemsResponse = (
              await this.$api.items.getItems({
                uId: this.$auth.user?.Id,
                userId: this.$auth.user?.Id,
                parentId: this.$route.params.viewId,
                includeItemTypes: this.viewType,
                sortBy:
                  this.collectionInfo.CollectionType === 'homevideos' ||
                  this.collectionInfo.Type === 'Folder' ||
                  (this.collectionInfo.Type === 'CollectionFolder' &&
                    !('CollectionType' in this.collectionInfo))
                    ? 'IsFolder,SortName'
                    : this.sortBy,
                recursive:
                  this.collectionInfo.CollectionType === 'homevideos' ||
                  this.collectionInfo.Type === 'Folder' ||
                  (this.collectionInfo.Type === 'CollectionFolder' &&
                    !('CollectionType' in this.collectionInfo))
                    ? undefined
                    : true,
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
