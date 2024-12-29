<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-sm="start">
        <VCol
          cols="6"
          sm="3">
          <ItemCard :item="item" />
        </VCol>
        <VCol
          cols="12"
          sm="7">
          <VRow class="d-flex flex-column">
            <div class="d-flex flex-column ml-sm-4">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                {{ $t('artist') }}
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
      <VRow>
        <VCol>
          <VTabs
            v-model="activeTab"
            bg-color="transparent">
            <VTab
              :value="0"
              :disabled="discography.length === 0">
              {{ $t('discography') }}
            </VTab>
            <VTab
              :value="1"
              :disabled="albums.length === 0">
              {{ $t('albums') }}
            </VTab>
            <VTab
              :value="2"
              :disabled="eps.length === 0">
              {{ $t('eps') }}
            </VTab>
            <VTab
              :value="3"
              :disabled="singles.length === 0">
              {{ $t('singles') }}
            </VTab>
            <VTab
              :value="4"
              :disabled="appearances.length === 0">
              {{ $t('appearsOn') }}
            </VTab>
            <VTab
              :value="5"
              :disabled="musicVideos.length === 0">
              {{ $t('videos') }}
            </VTab>
            <VTab
              :value="6"
              :disabled="!item.Overview">
              {{ $t('information') }}
            </VTab>
          </VTabs>
          <VWindow
            v-model="activeTab"
            class="bg-transparent">
            <VWindowItem :value="0">
              <ArtistTab
                :tracks-by-release
                :releases="discography" />
            </VWindowItem>
            <VWindowItem :value="1">
              <ArtistTab
                :tracks-by-release
                :releases="albums" />
            </VWindowItem>
            <VWindowItem :value="2">
              <ArtistTab
                :tracks-by-release
                :releases="eps" />
            </VWindowItem>
            <VWindowItem :value="3">
              <ArtistTab
                :tracks-by-release
                :releases="singles" />
            </VWindowItem>
            <VWindowItem :value="4">
              <VContainer>
                <VRow>
                  <VCol>
                    <ItemGrid
                      :items="appearances"
                      large
                      no-virtual />
                  </VCol>
                </VRow>
              </VContainer>
            </VWindowItem>
            <VWindowItem :value="5">
              <VContainer>
                <VRow>
                  <VCol>
                    <ItemGrid
                      :items="musicVideos"
                      large
                      no-virtual />
                  </VCol>
                </VRow>
              </VContainer>
            </VWindowItem>
            <VWindowItem :value="6">
              <VContainer>
                <VRow>
                  <VCol>
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
                  </VCol>
                </VRow>
              </VContainer>
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
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
  SortOrder,
  type BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { msToTicks } from '#/utils/time';
import { defaultSortOrder as sortBy } from '#/utils/items';
import { useBaseItem } from '#/composables/apis';
import { useItemBackdrop } from '#/composables/backdrop';
import { useItemPageTitle } from '#/composables/page-title';

const SINGLE_MAX_LENGTH_MS = 600_000;
const EP_MAX_LENGTH_MS = 1_800_000;

const route = useRoute('/artist/[itemId]');

const activeTab = ref(0);

const [
  { data: item },
  { data: relatedItems },
  { data: discography },
  { data: appearances },
  { data: musicVideos }
] = await Promise.all([
  useBaseItem(getUserLibraryApi, 'getItem')(() => ({
    itemId: route.params.itemId
  })),
  useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
    itemId: route.params.itemId,
    limit: 5
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    albumArtistIds: [route.params.itemId],
    sortBy,
    sortOrder: [SortOrder.Descending],
    recursive: true,
    includeItemTypes: [BaseItemKind.MusicAlbum]
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    contributingArtistIds: [route.params.itemId],
    excludeItemIds: [route.params.itemId],
    sortBy,
    sortOrder: [SortOrder.Descending],
    recursive: true,
    includeItemTypes: [BaseItemKind.MusicAlbum]
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    artistIds: [route.params.itemId],
    sortBy,
    sortOrder: [SortOrder.Descending],
    recursive: true,
    includeItemTypes: [BaseItemKind.MusicVideo]
  }))
]);

const all_tracks = await Promise.all(discography.value.map(album =>
  useBaseItem(getItemsApi, 'getItems')(() => ({
    parentId: album.Id,
    sortBy: ['SortName'],
    sortOrder: [SortOrder.Ascending]
  })))
);

const tracksByRelease = computed(() => {
  const map = new Map<BaseItemDto['Id'], BaseItemDto[]>();

  for (let i = 0; i < discography.value.length; i++) {
    map.set(discography.value[i]!.Id, all_tracks[i]!.data.value);
  }

  return map;
});

const singles = computed<BaseItemDto[]>(() =>
  discography.value.filter(
    album =>
      (album.RunTimeTicks ?? album.CumulativeRunTimeTicks ?? 0)
      <= msToTicks(SINGLE_MAX_LENGTH_MS)
  )
);

const eps = computed(() =>
  discography.value.filter(
    album =>
      (album.RunTimeTicks ?? album.CumulativeRunTimeTicks ?? 0)
      > msToTicks(SINGLE_MAX_LENGTH_MS)
      && (album.RunTimeTicks ?? album.CumulativeRunTimeTicks ?? 0)
      <= msToTicks(EP_MAX_LENGTH_MS)
  )
);

const albums = computed(() =>
  discography.value.filter(
    album =>
      (album.RunTimeTicks ?? album.CumulativeRunTimeTicks ?? 0)
      > msToTicks(EP_MAX_LENGTH_MS)
  )
);

useItemPageTitle(item);
useItemBackdrop(item);

/**
 * Set the most appropiate starting tag
 */
if (discography.value.length) {
  activeTab.value = 0;
} else if (albums.value.length) {
  activeTab.value = 1;
} else if (eps.value.length) {
  activeTab.value = 2;
} else if (singles.value.length) {
  activeTab.value = 3;
} else if (appearances.value.length) {
  activeTab.value = 4;
} else if (musicVideos.value.length) {
  activeTab.value = 5;
} else {
  // Overview
  activeTab.value = 6;
}
</script>
