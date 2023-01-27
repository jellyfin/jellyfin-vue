<template>
  <div>
    <v-app-bar flat :class="useResponsiveClasses('second-toolbar')">
      <v-tabs class="mx-auto" v-model="searchTab">
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
          <v-window v-model="searchTab" class="bg-transparent">
            <v-window-item :key="0">
              <item-grid :items="topSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="1">
              <item-grid :items="movieSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="2">
              <item-grid :items="showSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="3">
              <item-grid :items="albumSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="4">
              <item-grid :items="trackSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="5">
              <item-grid :items="bookSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="6">
              <item-grid :items="personSearchResults" :loading="loading" />
            </v-window-item>
            <v-window-item :key="7">
              <item-grid :items="artistSearchResults" :loading="loading" />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, watch, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { debounce } from 'lodash-es';
import { useRemote, useResponsiveClasses } from '@/composables';

const route = useRoute();
const router = useRouter();
const remote = useRemote();

const loading = ref(false);
const searchTab = ref(0);
const topSearchResults = ref<BaseItemDto[]>([]);
const movieSearchResults = ref<BaseItemDto[]>([]);
const showSearchResults = ref<BaseItemDto[]>([]);
const albumSearchResults = ref<BaseItemDto[]>([]);
const trackSearchResults = ref<BaseItemDto[]>([]);
const bookSearchResults = ref<BaseItemDto[]>([]);
const personSearchResults = ref<BaseItemDto[]>([]);
const artistSearchResults = ref<BaseItemDto[]>([]);

const searchQuery = computed(() => {
  return route.query?.q?.toString() || '';
});

watch(
  () => searchQuery,
  (newQuery) => {
    if (newQuery.value !== '') {
      performSearchDebounce();
    }
  }
);

onBeforeMount(async () => {
  if (searchQuery.value === '') {
    router.back();
  } else {
    await performSearch();
  }
});

const performSearchDebounce = debounce(async () => await performSearch(), 500);

/**
 * Search in Jellyfin
 */
async function performSearch(): Promise<void> {
  loading.value = true;

  const itemResults = (
    await remote.sdk.newUserApi(getItemsApi).getItemsByUserId({
      userId: remote.auth.currentUserId || '',
      searchTerm: searchQuery.value,
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

  if (itemResults) {
    topSearchResults.value = itemResults.slice(0, 24);

    movieSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === BaseItemKind.Movie
    );

    showSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === BaseItemKind.Series
    );

    albumSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === BaseItemKind.MusicAlbum
    );

    trackSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === BaseItemKind.Audio
    );

    bookSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === BaseItemKind.Book
    );

    personSearchResults.value =
      (
        await remote.sdk.newUserApi(getPersonsApi).getPersons({
          userId: remote.auth.currentUserId,
          searchTerm: searchQuery.value
        })
      ).data.Items || [];

    artistSearchResults.value = itemResults.filter(
      (item: BaseItemDto) => item.Type === 'MusicArtist'
    );
  }

  loading.value = false;
}
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
