<template>
  <div>
    <v-app-bar fixed flat dense :class="useResponsiveClasses('second-toolbar')">
      <v-tabs v-model="searchTab" centered>
        <v-tab :key="0">{{ $t('search.topResults') }}</v-tab>
        <v-tab :key="1">{{ $t('movies') }}</v-tab>
        <v-tab :key="2">{{ $t('shows') }}</v-tab>
        <v-tab :key="3">{{ $t('albums') }}</v-tab>
        <v-tab :key="4">{{ $t('songs') }}</v-tab>
        <v-tab :key="5">{{ $t('books') }}</v-tab>
        <v-tab :key="6">{{ $t('people') }}</v-tab>
        <v-tab :key="7">{{ $t('artists') }}</v-tab>
      </v-tabs>
    </v-app-bar>
    <v-container class="after-second-toolbar">
      <v-row>
        <v-col>
          <v-tabs v-model="searchTab" class="bg-transparent">
            <v-tab :key="0">
              <item-grid :items="topSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="1">
              <item-grid :items="movieSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="2">
              <item-grid :items="showSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="3">
              <item-grid :items="albumSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="4">
              <item-grid :items="trackSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="5">
              <item-grid :items="bookSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="6">
              <item-grid :items="personSearchResults" :loading="loading" />
            </v-tab>
            <v-tab :key="7">
              <item-grid :items="artistSearchResults" :loading="loading" />
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { debounce } from 'lodash-es';
import { useResponsiveClasses } from '@/composables';

export default defineComponent({
  setup() {
    return { useResponsiveClasses };
  },
  data() {
    return {
      loading: false,
      searchTab: 0,
      topSearchResults: [] as BaseItemDto[],
      movieSearchResults: [] as BaseItemDto[],
      showSearchResults: [] as BaseItemDto[],
      albumSearchResults: [] as BaseItemDto[],
      trackSearchResults: [] as BaseItemDto[],
      bookSearchResults: [] as BaseItemDto[],
      personSearchResults: [] as BaseItemDto[],
      artistSearchResults: [] as BaseItemDto[]
    };
  },
  computed: {
    searchQuery(): string {
      return this.$route.query?.q?.toString() || '';
    }
  },
  watch: {
    searchQuery(newQuery: string): void {
      if (newQuery !== '') {
        this.performSearchDebounce();
      }
    }
  },
  async beforeMount() {
    if (this.searchQuery === '') {
      this.$router.back();
    } else {
      await this.performSearch();
    }
  },
  methods: {
    performSearchDebounce: debounce(
      // @ts-expect-error - TypeScript confuses the context with lodash's debounce typings
      async () => await this.performSearch(),
      500
    ),
    async performSearch(): Promise<void> {
      this.loading = true;

      const itemResults = (
        await this.$remote.sdk.newUserApi(getItemsApi).getItemsByUserId({
          userId: this.$remote.auth.currentUserId || '',
          searchTerm: this.searchQuery,
          includeItemTypes: [
            BaseItemKind.Movie,
            BaseItemKind.Series,
            BaseItemKind.Audio,
            BaseItemKind.MusicAlbum,
            BaseItemKind.Book,
            BaseItemKind.MusicArtist,
            BaseItemKind.Person
          ],
          recursive: true
        })
      ).data.Items;

      this.topSearchResults = itemResults.slice(0, 24);

      this.movieSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'Movie'
      );

      this.showSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'Series'
      );

      this.albumSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'MusicAlbum'
      );

      this.trackSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'Audio'
      );

      this.bookSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'Book'
      );

      this.personSearchResults = (
        await this.$remote.sdk.newUserApi(getPersonsApi).getPersons({
          userId: this.$remote.auth.currentUserId,
          searchTerm: this.searchQuery
        })
      ).data.Items;

      this.artistSearchResults = itemResults.filter(
        (item: BaseItemDto) => item.Type === 'MusicArtist'
      );

      this.loading = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.second-toolbar {
  top: 56px;
}

.second-toolbar.md-and-up {
  top: 64px;
}

.second-toolbar.lg-and-up {
  left: 256px !important;
}

.after-second-toolbar {
  padding-top: 48px;
}
</style>
