<template>
  <div>
    <VAppBar
      flat
      :class="useResponsiveClasses('second-toolbar')">
      <VTabs
        v-model="searchTab"
        class="mx-auto">
        <VTab
          :key="0"
          :disabled="movies.length <= 0">
          {{ $t('movies') }}
        </VTab>
        <VTab
          :key="1"
          :disabled="series.length <= 0">
          {{ $t('shows') }}
        </VTab>
        <VTab
          :key="2"
          :disabled="albums.length <= 0">
          {{ $t('albums') }}
        </VTab>
        <VTab
          :key="3"
          :disabled="tracks.length <= 0">
          {{ $t('songs') }}
        </VTab>
        <VTab
          :key="4"
          :disabled="books.length <= 0">
          {{ $t('books') }}
        </VTab>
        <VTab
          :key="5"
          :disabled="people.length <= 0">
          {{ $t('people') }}
        </VTab>
        <VTab
          :key="6"
          :disabled="artists.length <= 0">
          {{ $t('artists') }}
        </VTab>
      </VTabs>
    </VAppBar>
    <VContainer class="after-second-toolbar">
      <VRow>
        <VCol>
          <VWindow
            v-model="searchTab"
            class="bg-transparent">
            <VWindowItem :key="0">
              <ItemGrid :items="movies" />
            </VWindowItem>
            <VWindowItem :key="1">
              <ItemGrid :items="series" />
            </VWindowItem>
            <VWindowItem :key="2">
              <ItemGrid :items="albums" />
            </VWindowItem>
            <VWindowItem :key="3">
              <ItemGrid :items="tracks" />
            </VWindowItem>
            <VWindowItem :key="4">
              <ItemGrid :items="books" />
            </VWindowItem>
            <VWindowItem :key="5">
              <ItemGrid :items="people" />
            </VWindowItem>
            <VWindowItem :key="6">
              <ItemGrid :items="artists" />
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
import { BaseItemKind, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { refDebounced } from '@vueuse/core';
import { computed, shallowRef } from 'vue';
import { useRoute } from 'vue-router/auto';
import { apiStore } from '@/store/api';
import { useResponsiveClasses } from '@/composables/use-responsive-classes';
import { useBaseItem } from '@/composables/apis';

const route = useRoute();

const searchTab = shallowRef(0);

const searchQuery = computed(() => route.query.q?.toString() ?? '');
const searchDebounced = refDebounced(searchQuery, 400);
const itemSearchMethod = computed(() => searchDebounced.value ? 'getItems' : undefined);
const peopleSearchMethod = computed(() => searchDebounced.value ? 'getPersons' : undefined);
const { loading: itemLoading, data: itemSearch } = await useBaseItem(getItemsApi, itemSearchMethod, {
  skipCache: { request: true }
})(() => ({
  searchTerm: searchDebounced.value,
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
}));

const { loading: peopleLoading, data: peopleSearch } = await useBaseItem(getPersonsApi, peopleSearchMethod, {
  skipCache: { request: true }
})(() => ({
  searchTerm: searchDebounced.value
}));

const serverSearchIds = computed(() => {
  if (!peopleLoading.value && !itemLoading.value) {
    return [...(itemSearch.value ?? []), ...(peopleSearch.value ?? [])].map(i => i.Id!);
  }

  return [];
});
const items = computed(() => {
  if (searchDebounced.value) {
    const items = apiStore.findItems(searchDebounced.value);
    const itemsIds = new Set(items.map(i => i.Id!));
    const serverItems = serverSearchIds.value.filter(i => !itemsIds.has(i));

    return [...items, ...(apiStore.getItemsById(serverItems) as BaseItemDto[])];
  }

  return [];
});
const movies = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.Movie)
);
const series = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.Series)
);
const albums = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.MusicAlbum)
);
const tracks = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.Audio)
);
const books = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.Book)
);
const artists = computed(() =>
  items.value.filter(item => item.Type === BaseItemKind.MusicArtist)
);
const people = computed(() => items.value.filter(item => item.Type === BaseItemKind.Person));
</script>

<style scoped>
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
