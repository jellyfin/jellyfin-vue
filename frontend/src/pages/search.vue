<template>
  <div>
    <v-app-bar flat :class="useResponsiveClasses('second-toolbar')">
      <v-tabs v-model="searchTab" class="mx-auto">
        <v-tab :key="0" :disabled="movies.length <= 0">
          {{ $t('movies') }}
        </v-tab>
        <v-tab :key="1" :disabled="series.length <= 0">
          {{ $t('shows') }}
        </v-tab>
        <v-tab :key="2" :disabled="albums.length <= 0">
          {{ $t('albums') }}
        </v-tab>
        <v-tab :key="3" :disabled="tracks.length <= 0">
          {{ $t('songs') }}
        </v-tab>
        <v-tab :key="4" :disabled="books.length <= 0">
          {{ $t('books') }}
        </v-tab>
        <v-tab :key="5" :disabled="people.length <= 0">
          {{ $t('people') }}
        </v-tab>
        <v-tab :key="6" :disabled="artists.length <= 0">
          {{ $t('artists') }}
        </v-tab>
      </v-tabs>
    </v-app-bar>
    <v-container class="after-second-toolbar">
      <v-row>
        <v-col>
          <v-window v-model="searchTab" class="bg-transparent">
            <v-window-item :key="0">
              <item-grid :items="movies" />
            </v-window-item>
            <v-window-item :key="1">
              <item-grid :items="series" />
            </v-window-item>
            <v-window-item :key="2">
              <item-grid :items="albums" />
            </v-window-item>
            <v-window-item :key="3">
              <item-grid :items="tracks" />
            </v-window-item>
            <v-window-item :key="4">
              <item-grid :items="books" />
            </v-window-item>
            <v-window-item :key="5">
              <item-grid :items="people" />
            </v-window-item>
            <v-window-item :key="6">
              <item-grid :items="artists" />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useRoute } from 'vue-router';
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

const searchQuery = computed(() => route.query?.q?.toString() || '');
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
          userId: remote.auth.currentUserId || '',
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
