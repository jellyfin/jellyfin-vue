<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-sm="start"
        align="center">
        <VCol
          cols="6"
          sm="3">
          <VResponsive aspect-ratio="1">
            <VAvatar
              color="card"
              size="100%"
              class="elevation-2">
              <BlurhashImage :item="item" />
            </VAvatar>
          </VResponsive>
        </VCol>
        <VCol
          cols="12"
          sm="7">
          <VRow
            justify="center"
            justify-sm="start">
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
              <PlayButton :item="item" />
              <ItemMenu :item="item" />
              <LikeButton :item="item" />
            </div>
          </VRow>
        </VCol>
      </VRow>
      <VTabs
        v-model="activeTab"
        bg-color="transparent">
        <VTab
          :value="0"
          :disabled="movies.length === 0">
          {{ $t('item.person.movies') }}
        </VTab>
        <VTab
          :value="1"
          :disabled="series.length === 0">
          {{ $t('item.person.shows') }}
        </VTab>
        <VTab
          :value="2"
          :disabled="books.length === 0">
          {{ $t('item.person.books') }}
        </VTab>
        <VTab
          :value="3"
          :disabled="photos.length === 0">
          {{ $t('item.person.photos') }}
        </VTab>
        <VTab
          :value="4"
          :disabled="!item.Overview">
          {{ $t('item.person.information') }}
        </VTab>
      </VTabs>
      <VWindow
        v-model="activeTab"
        class="bg-transparent">
        <VWindowItem :value="0">
          <ItemGrid
            :items="movies"
            large
            no-virtual />
        </VWindowItem>
        <VWindowItem :value="1">
          <ItemGrid
            :items="series"
            large
            no-virtual />
        </VWindowItem>
        <VWindowItem :value="2">
          <ItemGrid
            :items="books"
            large
            no-virtual />
        </VWindowItem>
        <VWindowItem :value="3">
          <ItemGrid
            :items="photos"
            large
            no-virtual />
        </VWindowItem>
        <VWindowItem :value="4">
          <VRow>
            <VCol
              cols="12"
              md="7">
              <!-- eslint-disable vue/no-v-html -
                Output is properly sanitized using sanitizeHtml -->
              <span
                v-if="item.Overview"
                class="item-overview"
                v-html="sanitizeHtml(item.Overview, true)" />
              <!-- eslint-enable vue/no-v-html -->
            </VCol>
            <VCol
              cols="12"
              md="5">
              <VRow
                v-if="birthDate || birthPlace"
                no-gutters>
                <VCol
                  cols="2"
                  md="5"
                  class="text--secondary">
                  {{ $t('item.person.birth') }}
                </VCol>
                <VCol
                  cols="9"
                  md="7">
                  <p>{{ birthDate }}</p>
                  <p>{{ birthPlace }}</p>
                </VCol>
              </VRow>
              <VRow
                v-if="deathDate"
                no-gutters>
                <VCol
                  cols="2"
                  md="5"
                  class="text--secondary">
                  {{ $t('item.person.death') }}
                </VCol>
                <VCol
                  cols="9"
                  md="7">
                  {{ deathDate }}
                </VCol>
              </VRow>
              <VRow
                v-if="!deathDate && !birthDate && !birthPlace"
                no-gutters>
                <VCol cols="12">
                  {{ $t('noInformationAvailable') }}
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VWindowItem>
      </VWindow>
    </template>
    <template #right>
      <RelatedItems
        :item="item"
        vertical>
        {{ $t('moreLikeArtist', { artist: item.Name }) }}
      </RelatedItems>
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router/auto';
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
import { sanitizeHtml } from '@/utils/html';
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
