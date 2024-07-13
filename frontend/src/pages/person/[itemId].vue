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
            <div class="d-flex flex-column ml-sm-4">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                {{ $t('person') }}
              </div>
              <h1 class="text-h4 text-md-h2">
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
          {{ $t('movies') }}
        </VTab>
        <VTab
          :value="1"
          :disabled="series.length === 0">
          {{ $t('shows') }}
        </VTab>
        <VTab
          :value="2"
          :disabled="books.length === 0">
          {{ $t('books') }}
        </VTab>
        <VTab
          :value="3"
          :disabled="photos.length === 0">
          {{ $t('photos') }}
        </VTab>
        <VTab
          :value="4"
          :disabled="!item.Overview">
          {{ $t('information') }}
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
              <span
                v-if="item.Overview"
                class="item-overview">
                <JSafeHtml
                  :html="item.Overview"
                  markdown />
              </span>
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
                  {{ $t('birth') }}
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
                  {{ $t('death') }}
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
        :related-items="relatedItems"
        vertical>
        {{ $t('moreLikeArtist', { artist: item.Name }) }}
      </RelatedItems>
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import {
  BaseItemKind,
  SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { format } from 'date-fns';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defaultSortOrder as sortBy } from '@/utils/items';
import { useDateFns } from '@/composables/use-datefns';
import { useBaseItem } from '@/composables/apis';
import { useItemBackdrop } from '@/composables/backdrop';
import { useItemPageTitle } from '@/composables/page-title';

const route = useRoute('/person/[itemId]');

const activeTab = ref(4);

const { data: item } = await useBaseItem(getUserLibraryApi, 'getItem')(() => ({
  itemId: route.params.itemId
}));
const { data: relatedItems } = await useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
  itemId: route.params.itemId,
  limit: 5
}));
const { data: movies } = await useBaseItem(getItemsApi, 'getItems')(() => ({
  personIds: [route.params.itemId],
  sortBy,
  sortOrder: [SortOrder.Descending],
  recursive: true,
  includeItemTypes: [BaseItemKind.Movie]
}));
const { data: series } = await useBaseItem(getItemsApi, 'getItems')(() => ({
  personIds: [route.params.itemId],
  sortBy,
  sortOrder: [SortOrder.Descending],
  recursive: true,
  includeItemTypes: [BaseItemKind.Series]
}));
const { data: books } = await useBaseItem(getItemsApi, 'getItems')(() => ({
  personIds: [route.params.itemId],
  sortBy,
  sortOrder: [SortOrder.Descending],
  recursive: true,
  includeItemTypes: [BaseItemKind.Book]
}));
const { data: photos } = await useBaseItem(getItemsApi, 'getItems')(() => ({
  personIds: [route.params.itemId],
  sortBy,
  sortOrder: [SortOrder.Descending],
  recursive: true,
  includeItemTypes: [BaseItemKind.Photo]
}));

const birthDate = computed(() =>
  item.value.PremiereDate
    ? useDateFns(format, new Date(item.value.PremiereDate), 'PPP')
    : undefined
);

const deathDate = computed(() =>
  item.value.EndDate
    ? useDateFns(format, new Date(item.value.EndDate), 'PPP')
    : undefined
);

const birthPlace = computed(
  () => item.value.ProductionLocations?.[0] ?? undefined
);

useItemPageTitle(item);
useItemBackdrop(item);

/**
 * Pick the most relevant tab to display at mount
 */
if (movies.value.length) {
  activeTab.value = 0;
} else if (series.value.length) {
  activeTab.value = 1;
} else if (books.value.length) {
  activeTab.value = 2;
} else if (photos.value.length) {
  activeTab.value = 3;
} else {
  activeTab.value = 4;
}
</script>
