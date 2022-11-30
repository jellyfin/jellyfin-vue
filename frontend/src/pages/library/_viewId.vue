<template>
  <div>
    <v-app-bar dense flat>
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
        :disabled="noContent"
        @change="onChangeType" />
      <v-divider
        v-if="isSortable && hasViewTypes"
        inset
        vertical
        class="mx-2" />
      <sort-button
        v-if="isSortable"
        :disabled="noContent"
        @change="onChangeSort" />
      <filter-button
        v-if="isSortable"
        :collection-info="collectionInfo"
        :disabled="loading || (items.length === 0 && !hasFilters)"
        :items-type="viewType"
        @change="onChangeFilter" />
      <v-spacer />
      <play-button :item="collectionInfo" shuffle :disabled="noContent" />
      <play-button :item="collectionInfo" :disabled="noContent" />
    </v-app-bar>
    <v-container>
      <skeleton-item-grid v-if="loading" :view-type="viewType" />
      <item-grid :loading="loading" :items="items">
        <h1 v-if="!hasFilters && isDefaultView" class="text-h5">
          {{ hasFilters ? $t('libraryEmptyFilters') : $t('libraryEmpty') }}
        </h1>
      </item-grid>
    </v-container>
    <scroll-to-top-button />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getMusicGenresApi } from '@jellyfin/sdk/lib/utils/api/music-genres-api';
import { getStudiosApi } from '@jellyfin/sdk/lib/utils/api/studios-api';
import { validLibraryTypes } from '~/utils/items';
import { useRemote, useSnackbar } from '@/composables';

export default defineComponent({
  async setup() {
    const { params } = useRoute();
    const remote = useRemote();
    const collectionInfo = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId.value,
        ids: [params.viewId]
      })
    ).data?.Items?.[0];

    return {
      useSnackbar,
      collectionInfo
    };
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
      filterIs3d: undefined as boolean | undefined
    };
  },
  computed: {
    noContent(): boolean {
      return this.loading || !this.itemsCount;
    },
    hasViewTypes(): boolean {
      return !(
        ['homevideos'].includes(this.collectionInfo.CollectionType || '') ||
        this.collectionInfo.CollectionType === undefined
      );
    },
    isSortable(): boolean {
      // Not everything is sortable, so depending on what we're showing, we need to hide the sort menu.
      // Reusing this as "isFilterable" too, since these seem to go hand in hand for now.
      return ![
        'MusicArtist',
        'Actor',
        'Genre',
        'MusicGenre',
        'MusicGenre',
        'Studio'
      ].includes(this.viewType);
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
    if (
      this.collectionInfo?.Type &&
      validLibraryTypes.includes(this.collectionInfo.Type)
    ) {
      if (this.collectionInfo.Name) {
        this.$route.meta.title = this.collectionInfo.Name;
      }

      // Set default view type - This will trigger an items refresh
      switch (this.collectionInfo.CollectionType) {
        case 'tvshows': {
          this.viewType = 'Series';
          break;
        }
        case 'movies': {
          this.viewType = 'Movie';
          break;
        }
        case 'books': {
          this.viewType = 'Book';
          break;
        }
        case 'music': {
          this.viewType = 'MusicAlbum';
          break;
        }
        default: {
          await this.refreshItems();
          break;
        }
      }
    }
  },
  methods: {
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
      this.filterIsHd = filter.types.includes('isHD') ? true : undefined;

      this.filterIs4k = filter.types.includes('is4K') ? true : undefined;

      this.filterIs3d = filter.types.includes('is3D') ? true : undefined;

      this.refreshItems();
    },
    async refreshItems(): Promise<void> {
      this.loading = true;

      try {
        let itemsResponse;

        switch (this.viewType) {
          case 'MusicArtist': {
            itemsResponse = (
              await this.$remote.sdk.newUserApi(getArtistsApi).getAlbumArtists({
                userId: this.$remote.auth.currentUserId.value,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          }
          case 'Actor': {
            itemsResponse = (
              await this.$remote.sdk.newUserApi(getPersonsApi).getPersons({
                userId: this.$remote.auth.currentUserId.value,
                parentId: this.$route.params.viewId,
                personTypes: ['Actor']
              })
            ).data;
            break;
          }
          case 'Genre': {
            itemsResponse = (
              await this.$remote.sdk.newUserApi(getGenresApi).getGenres({
                userId: this.$remote.auth.currentUserId.value,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          }
          case 'MusicGenre': {
            itemsResponse = (
              await this.$remote.sdk
                .newUserApi(getMusicGenresApi)
                .getMusicGenres({
                  userId: this.$remote.auth.currentUserId.value,
                  parentId: this.$route.params.viewId
                })
            ).data;
            break;
          }
          case 'Studio': {
            itemsResponse = (
              await this.$remote.sdk.newUserApi(getStudiosApi).getStudios({
                userId: this.$remote.auth.currentUserId.value,
                parentId: this.$route.params.viewId
              })
            ).data;
            break;
          }
          default: {
            itemsResponse = (
              await this.$remote.sdk.newUserApi(getItemsApi).getItems({
                uId: this.$remote.auth.currentUserId.value,
                userId: this.$remote.auth.currentUserId.value,
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
                filters: this.statusFilter || undefined,
                genres: this.genresFilter || undefined,
                years: this.yearsFilter || undefined,
                officialRatings: this.ratingsFilter || undefined,
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
        }

        this.items = itemsResponse.Items;
        this.itemsCount = itemsResponse.TotalRecordCount;
      } catch {
        this.items = [];
        this.itemsCount = 0;
        this.useSnackbar(this.$t('failedToRefreshItems'), 'error');
      }

      this.loading = false;
    }
  }
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
