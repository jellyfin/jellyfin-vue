<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-md="start">
        <VCol
          cols="7"
          md="3">
          <ItemCard :item="item" />
        </VCol>
        <VCol
          cols="12"
          md="9">
          <h1
            class="text-h4"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.AlbumArtist && item?.AlbumArtists?.[0]"
            class="text-subtitle-1 text-truncate mt-2"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            <RouterLink
              class="link"
              :to="getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')">
              {{ $t('byArtist', { artist: item.AlbumArtist }) }}
            </RouterLink>
          </h2>
          <div
            class="text-caption text-h4 font-weight-medium mt-2"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            <MediaInfo
              :item="item"
              year
              runtime
              rating
              ends-at />
          </div>
          <VRow
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.display.mdAndUp,
              'ml-0': $vuetify.display.mdAndUp
            }">
            <PlayButton :item="item" />
            <LikeButton
              :item="item"
              class="mr-2" />
            <MarkPlayedButton
              :item="item"
              class="mr-2" />
            <ItemMenu :item="item" />
          </VRow>
          <VCol
            cols="12"
            md="10">
            <VRow
              v-if="item && item.GenreItems && item.GenreItems.length"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="text-truncate px-0">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </VCol>
              <VCol
                class="px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'ml-2': index > 0 }"
                      :to="`/genre/${genre.Id}?type=${item.Type}`">
                      {{ genre.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
          </VCol>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <TrackList
            v-if="item.Type === 'MusicAlbum'"
            :item="item"
            :tracks />
        </VCol>
      </VRow>
    </template>
    <template #right>
      <RelatedItems
        :related-items="relatedItems"
        vertical />
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useRoute } from 'vue-router';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '#/utils/items';
import { useBaseItem } from '#/composables/apis';
import { useItemBackdrop } from '#/composables/backdrop';
import { useItemPageTitle } from '#/composables/page-title';

const route = useRoute('/musicalbum/[itemId]');

const [{ data: item }, { data: relatedItems }, { data: tracks }] = await Promise.all([
  useBaseItem(getUserLibraryApi, 'getItem')(() => ({
    itemId: route.params.itemId
  })),
  useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
    itemId: route.params.itemId,
    limit: 5
  })),
  useBaseItem(getItemsApi, 'getItems')(() => ({
    parentId: route.params.itemId,
    sortBy: ['SortName'],
    sortOrder: [SortOrder.Ascending]
  }))
]);

useItemPageTitle(item);
useItemBackdrop(item);
</script>
