<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start" align="center">
        <v-col cols="6" sm="3">
          <v-responsive aspect-ratio="1">
            <v-avatar color="card" size="100%" class="elevation-2">
              <blurhash-image :item="item" />
            </v-avatar>
          </v-responsive>
        </v-col>
        <v-col cols="12" sm="7">
          <v-row justify="center" justify-sm="start">
            <div class="ml-sm-4 d-flex flex-column">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                {{ $t('item.person.person') }}
              </div>
              <h1 class="text-h4 text-md-h2 font-weight-light">
                {{ item.Name }}
              </h1>
            </div>
            <div class="d-flex align-center ml-sm-4 my-2">
              <play-button :item="item" />
              <item-menu :item="item" />
              <like-button :item="item" />
            </div>
          </v-row>
        </v-col>
      </v-row>
      <v-tabs v-model="activeTab" bg-color="transparent">
        <v-tab :value="0" :disabled="movies.length === 0">
          {{ $t('item.person.movies') }}
        </v-tab>
        <v-tab :value="1" :disabled="series.length === 0">
          {{ $t('item.person.shows') }}
        </v-tab>
        <v-tab :value="2" :disabled="books.length === 0">
          {{ $t('item.person.books') }}
        </v-tab>
        <v-tab :value="3" :disabled="photos.length === 0">
          {{ $t('item.person.photos') }}
        </v-tab>
        <v-tab :value="4" :disabled="!item.Overview">
          {{ $t('item.person.information') }}
        </v-tab>
      </v-tabs>
      <v-window v-model="activeTab" class="bg-transparent">
        <v-window-item :value="0">
          <item-grid :items="movies" large no-virtual />
        </v-window-item>
        <v-window-item :value="1">
          <item-grid :items="series" large no-virtual />
        </v-window-item>
        <v-window-item :value="2">
          <item-grid :items="books" large no-virtual />
        </v-window-item>
        <v-window-item :value="3">
          <item-grid :items="photos" large no-virtual />
        </v-window-item>
        <v-window-item :value="4">
          <v-row>
            <v-col cols="12" md="7">
              <span class="item-overview" v-text="item.Overview" />
            </v-col>
            <v-col cols="12" md="5">
              <v-row v-if="birthDate || birthPlace" no-gutters>
                <v-col cols="2" md="5" class="text--secondary">
                  {{ $t('item.person.birth') }}
                </v-col>
                <v-col cols="9" md="7">
                  <p>{{ birthDate }}</p>
                  <p>{{ birthPlace }}</p>
                </v-col>
              </v-row>
              <v-row v-if="deathDate" no-gutters>
                <v-col cols="2" md="5" class="text--secondary">
                  {{ $t('item.person.death') }}
                </v-col>
                <v-col cols="9" md="7">
                  {{ deathDate }}
                </v-col>
              </v-row>
              <v-row v-if="!deathDate && !birthDate && !birthPlace" no-gutters>
                <v-col cols="12">
                  {{ $t('noInformationAvailable') }}
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </template>
    <template #right>
      <related-items :item="item" vertical>
        {{ $t('moreLikeArtist', { artist: item.Name }) }}
      </related-items>
    </template>
  </item-cols>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ImageType,
  ItemFields,
  SortOrder,
  BaseItemKind,
  BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { format } from 'date-fns';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getBlurhash } from '@/utils/images';
import { useRemote, useDateFns } from '@/composables';

const route = useRoute();
const remote = useRemote();

const item = ref<BaseItemDto>({});
const movies = ref<BaseItemDto[]>([]);
const series = ref<BaseItemDto[]>([]);
const books = ref<BaseItemDto[]>([]);
const photos = ref<BaseItemDto[]>([]);
const activeTab = ref(4);

const birthDate = computed(() =>
  item.value.PremiereDate
    ? useDateFns(format, new Date(item.value.PremiereDate), 'PPP').value
    : undefined
);

const deathDate = computed(() =>
  item.value.EndDate
    ? useDateFns(format, new Date(item.value.EndDate), 'PPP').value
    : undefined
);

const birthPlace = computed(
  () => item.value.ProductionLocations?.[0] ?? undefined
);

onMounted(async () => {
  const { itemId } = route.params as { itemId: string };

  item.value = (
    await remote.sdk.newUserApi(getUserLibraryApi).getItem({
      userId: remote.auth.currentUserId ?? '',
      itemId
    })
  ).data;

  route.meta.title = item.value.Name;
  route.meta.backdrop.blurhash = getBlurhash(item.value, ImageType.Backdrop);

  movies.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Movie],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  series.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Series],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  books.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Book],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  photos.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Photo],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  // Used to pick the first tab with content to display
  if (movies.value.length > 0) {
    activeTab.value = 0;
  } else if (series.value.length > 0) {
    activeTab.value = 1;
  } else if (books.value.length > 0) {
    activeTab.value = 2;
  } else if (photos.value.length > 0) {
    activeTab.value = 3;
  } else {
    activeTab.value = 4;
  }
});
</script>
