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
import { computed, ref, reactive, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useRoute } from 'vue-router/auto';
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useRemote, useResponsiveClasses } from '@/composables';

const route = useRoute();
const remote = useRemote();

const searchTab = ref(0);
const memo = reactive(
  new Map<string, { items: BaseItemDto[]; people: BaseItemDto[] }>([
    ['', { items: [], people: [] }]
  ])
);

const searchQuery = computed(() => route.query?.q?.toString() ?? '');
const items = computed(() => memo.get(searchQuery.value)?.items ?? []);
const people = computed(() => memo.get(searchQuery.value)?.people ?? []);
const movies = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.Movie)
);
const series = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.Series)
);
const albums = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.MusicAlbum)
);
const tracks = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.Audio)
);
const books = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.Book)
);
const artists = computed(() =>
  items.value.filter((item) => item.Type === BaseItemKind.MusicArtist)
);

const performDebouncedSearch = useDebounceFn(async (searchTerm: string) => {
  if (!memo.has(searchTerm)) {
    const itemSearch =
      (
        await remote.sdk.newUserApi(getItemsApi).getItemsByUserId({
          userId: remote.auth.currentUserId ?? '',
          searchTerm,
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
      ).data.Items ?? [];
    const peopleSearch =
      (
        await remote.sdk.newUserApi(getPersonsApi).getPersons({
          userId: remote.auth.currentUserId,
          searchTerm
        })
      ).data.Items ?? [];

    memo.set(searchTerm, { items: itemSearch, people: peopleSearch });
  }
}, 400);

watch(searchQuery, async (q) => await performDebouncedSearch(q), {
  immediate: true
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
