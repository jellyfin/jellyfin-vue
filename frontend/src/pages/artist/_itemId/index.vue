<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start">
        <v-col cols="6" sm="3">
          <card :item="item" />
        </v-col>
        <v-col cols="12" sm="7">
          <v-row class="d-flex flex-column">
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
              <play-button :item="item" />
              <item-menu :item="item" />
              <like-button :item="item" />
            </div>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-tabs v-model="activeTab" bg-color="transparent">
            <v-tab :value="0" :disabled="discography.length === 0">
              {{ $t('item.artist.discography') }}
            </v-tab>
            <v-tab :value="1" :disabled="albums.length === 0">
              {{ $t('item.artist.albums') }}
            </v-tab>
            <v-tab :value="2" :disabled="eps.length === 0">
              {{ $t('item.artist.eps') }}
            </v-tab>
            <v-tab :value="3" :disabled="singles.length === 0">
              {{ $t('item.artist.singles') }}
            </v-tab>
            <v-tab :value="4" :disabled="appearances.length === 0">
              {{ $t('item.artist.appearsOn') }}
            </v-tab>
            <v-tab :value="5" :disabled="musicVideos.length === 0">
              {{ $t('item.artist.videos') }}
            </v-tab>
            <v-tab :value="6" :disabled="!item.Overview">
              {{ $t('item.artist.information') }}
            </v-tab>
          </v-tabs>
          <v-window v-model="activeTab" class="bg-transparent">
            <v-window-item :value="0">
              <artist-tab :releases="discography" />
            </v-window-item>
            <v-window-item :value="1">
              <artist-tab :releases="albums" />
            </v-window-item>
            <v-window-item :value="2">
              <artist-tab :releases="eps" />
            </v-window-item>
            <v-window-item :value="3">
              <artist-tab :releases="singles" />
            </v-window-item>
            <v-window-item :value="4">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="appearances" large no-virtual />
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>
            <v-window-item :value="5">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="musicVideos" large no-virtual />
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>
            <v-window-item :value="6">
              <v-container>
                <v-row>
                  <v-col>
                    <v-col cols="12" md="7">
                      <span class="item-overview" v-text="item.Overview" />
                    </v-col>
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
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
import { useRemote } from '@/composables';

const SINGLE_MAX_LENGTH_MS = 600_000;
const EP_MAX_LENGTH_MS = 1_800_000;

const route = useRoute();
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
  const { itemId } = route.params as { itemId: string };

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
    // overview
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
