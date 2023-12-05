<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-sm="start">
        <VCol
          cols="6"
          sm="3">
          <Card :item="item" />
        </VCol>
        <VCol
          cols="12"
          sm="7">
          <VRow class="d-flex flex-column">
            <div class="ml-sm-4 d-flex flex-column">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                {{ $t('artist') }}
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
      <VRow>
        <VCol>
          <VTabs
            v-model="activeTab"
            bg-color="transparent">
            <VTab
              :value="0"
              :disabled="discography.length === 0">
              {{ $t('item.artist.discography') }}
            </VTab>
            <VTab
              :value="1"
              :disabled="albums.length === 0">
              {{ $t('item.artist.albums') }}
            </VTab>
            <VTab
              :value="2"
              :disabled="eps.length === 0">
              {{ $t('item.artist.eps') }}
            </VTab>
            <VTab
              :value="3"
              :disabled="singles.length === 0">
              {{ $t('item.artist.singles') }}
            </VTab>
            <VTab
              :value="4"
              :disabled="appearances.length === 0">
              {{ $t('item.artist.appearsOn') }}
            </VTab>
            <VTab
              :value="5"
              :disabled="musicVideos.length === 0">
              {{ $t('item.artist.videos') }}
            </VTab>
            <VTab
              :value="6"
              :disabled="!item.Overview">
              {{ $t('item.artist.information') }}
            </VTab>
          </VTabs>
          <VWindow
            v-model="activeTab"
            class="bg-transparent">
            <VWindowItem :value="0">
              <ArtistTab :releases="discography" />
            </VWindowItem>
            <VWindowItem :value="1">
              <ArtistTab :releases="albums" />
            </VWindowItem>
            <VWindowItem :value="2">
              <ArtistTab :releases="eps" />
            </VWindowItem>
            <VWindowItem :value="3">
              <ArtistTab :releases="singles" />
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
                      <!-- eslint-disable vue/no-v-html -
                        Output is properly sanitized using sanitizeHtml -->
                      <span
                        v-if="item.Overview"
                        class="item-overview"
                        v-html="sanitizeHtml(item.Overview, true)" />
                      <!-- eslint-enable vue/no-v-html -->
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
  BaseItemDto,
  BaseItemKind,
  ImageType,
  ItemFields,
  SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getBlurhash } from '@/utils/images';
import { msToTicks } from '@/utils/time';
import { sanitizeHtml } from '@/utils/html';
import { useRemote } from '@/composables';

const SINGLE_MAX_LENGTH_MS = 600_000;
const EP_MAX_LENGTH_MS = 1_800_000;

const route = useRoute<'/artist/[itemId]'>();
const remote = useRemote();

const item = ref<BaseItemDto>({});
const discography = ref<BaseItemDto[]>([]);
const appearances = ref<BaseItemDto[]>([]);
const musicVideos = ref<BaseItemDto[]>([]);
const activeTab = ref(0);

const singles = computed<BaseItemDto[]>(() =>
  discography.value.filter(
    (album) =>
      (album?.RunTimeTicks ?? album?.CumulativeRunTimeTicks ?? 0) <=
      msToTicks(SINGLE_MAX_LENGTH_MS)
  )
);

const eps = computed(() =>
  discography.value.filter(
    (album) =>
      (album?.RunTimeTicks ?? album?.CumulativeRunTimeTicks ?? 0) >
      msToTicks(SINGLE_MAX_LENGTH_MS) &&
      (album?.RunTimeTicks ?? album?.CumulativeRunTimeTicks ?? 0) <=
      msToTicks(EP_MAX_LENGTH_MS)
  )
);

const albums = computed(() =>
  discography.value.filter(
    (album) =>
      (album?.RunTimeTicks ?? album?.CumulativeRunTimeTicks ?? 0) >
      msToTicks(EP_MAX_LENGTH_MS)
  )
);

onMounted(async () => {
  const { itemId } = route.params;

  item.value = (
    await remote.sdk.newUserApi(getUserLibraryApi).getItem({
      userId: remote.auth.currentUserId ?? '',
      itemId
    })
  ).data;

  route.meta.title = item.value.Name;
  route.meta.backdrop.blurhash = getBlurhash(item.value, ImageType.Backdrop);

  discography.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        albumArtistIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.MusicAlbum],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  appearances.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        contributingArtistIds: [itemId],
        excludeItemIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.MusicAlbum],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  musicVideos.value =
    (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        artistIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.MusicVideo],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId
      })
    ).data.Items ?? [];

  if (discography.value.length > 0) {
    activeTab.value = 0;
  } else if (albums.value.length > 0) {
    activeTab.value = 1;
  } else if (eps.value.length > 0) {
    activeTab.value = 2;
  } else if (singles.value.length > 0) {
    activeTab.value = 3;
  } else if (appearances.value.length > 0) {
    activeTab.value = 4;
  } else if (musicVideos.value.length > 0) {
    activeTab.value = 5;
  } else {
    // Overview
    activeTab.value = 6;
  }
});
</script>

<style lang="scss" scoped>
.person-image {
  border-radius: 50%;
}

.header span {
  padding-left: 0.25em;
}

.header::before {
  background-color: white;
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
</style>
