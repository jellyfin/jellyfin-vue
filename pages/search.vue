<template>
  <div>
    <v-app-bar fixed flat dense class="second-toolbar">
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
          <v-tabs-items v-model="searchTab" class="transparent">
            <v-tab-item :key="0">
              <item-grid :items="topSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="1">
              <item-grid :items="movieSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="2">
              <item-grid :items="showSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="3">
              <item-grid :items="albumSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="4">
              <item-grid :items="trackSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="5">
              <item-grid :items="bookSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="6">
              <item-grid :items="personSearchResults" :loading="loading" />
            </v-tab-item>
            <v-tab-item :key="7">
              <item-grid :items="artistSearchResults" :loading="loading" />
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';

export default Vue.extend({
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
      return this.$store.state.search.query;
    }
  },
  watch: {
    searchQuery(newQuery: string, _oldQuery: string): void {
      if (newQuery === '') {
        this.$router.back();
      } else {
        this.performSearch();
      }
    }
  },
  beforeMount() {
    if (this.searchQuery === '') {
      this.$router.back();
    }
  },
  destroyed() {
    this.setSearchQuery({ query: '' });
  },
  methods: {
    ...mapActions('search', ['setSearchQuery']),
    async performSearch(): Promise<void> {
      this.loading = true;

      const itemResults = (
        await this.$api.items.getItemsByUserId({
          userId: this.$auth.user.Id,
          searchTerm: this.searchQuery,
          includeItemTypes:
            'Movie,Series,Audio,MusicAlbum,Book,MusicArtist,Person',
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
        await this.$api.persons.getPersons({
          userId: this.$auth.user.Id,
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
  padding-top: 48px;
}
</style>
