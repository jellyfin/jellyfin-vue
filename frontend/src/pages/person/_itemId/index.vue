<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start">
        <v-col cols="6" sm="3" class="d-flex flex-row">
          <v-responsive aspect-ratio="1">
            <v-avatar
              color="card"
              width="100%"
              height="100%"
              class="elevation-2">
              <blurhash-image :item="item" />
            </v-avatar>
          </v-responsive>
        </v-col>
        <v-col cols="12" sm="7">
          <v-row justify="d-flex flex-column">
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
              <play-button :items="[item]" />
              <item-menu :item="item" />
              <like-button :item="item" />
            </div>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-tabs v-model="activeTab" bg-color="transparent">
            <v-tab :key="0" :disabled="movies.length === 0">
              {{ $t('item.person.movies') }}
            </v-tab>
            <v-tab :key="1" :disabled="series.length === 0">
              {{ $t('item.person.shows') }}
            </v-tab>
            <v-tab :key="2" :disabled="books.length === 0">
              {{ $t('item.person.books') }}
            </v-tab>
            <v-tab :key="3" :disabled="photos.length === 0">
              {{ $t('item.person.photos') }}
            </v-tab>
            <v-tab :key="4" :disabled="!item.Overview">
              {{ $t('item.person.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs v-model="activeTab" class="bg-transparent">
            <v-tab :key="0">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="movies" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="1">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="series" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="2">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="books" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="3">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="photos" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="4">
              <v-container>
                <v-row>
                  <v-col>
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
                            <p>
                              {{ birthDate }}
                              {{ birthPlace }}
                            </p>
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
                        <v-row
                          v-if="!deathDate && !birthDate && !birthPlace"
                          no-gutters>
                          <v-col cols="12">
                            {{ $t('noInformationAvailable') }}
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
          </v-tabs>
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

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import {
  BaseItemDto,
  ImageType,
  ItemFields,
  SortOrder,
  BaseItemKind
} from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getBlurhash } from '~/utils/images';
import { dateFnsFormat } from '@/utils/time';
import { useRemote } from '@/composables';

export default defineComponent({
  async setup() {
    const { params } = useRoute();
    const itemId = params.itemId;
    const remote = useRemote();
    const item = (
      await remote.sdk.newUserApi(getUserLibraryApi).getItem({
        userId: remote.auth.currentUserId.value || '',
        itemId
      })
    ).data;

    const movies = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Movie],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId.value
      })
    ).data.Items;

    const series = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Series],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId.value
      })
    ).data.Items;

    const books = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Book],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId.value
      })
    ).data.Items;

    const photos = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: [BaseItemKind.Photo],
        fields: Object.values(ItemFields),
        userId: remote.auth.currentUserId.value
      })
    ).data.Items;

    let activeTab = 4;

    if (movies?.length) {
      activeTab = 0;
    } else if (series?.length) {
      activeTab = 1;
    } else if (books?.length) {
      activeTab = 2;
    } else if (photos?.length) {
      activeTab = 3;
    }

    return { activeTab, movies, series, books, photos, item };
  },
  computed: {
    birthDate(): string | null {
      return this.item.PremiereDate
        ? dateFnsFormat(new Date(this.item.PremiereDate), 'PPP').value
        : null;
    },
    deathDate: {
      get(): string | null {
        return this.item.EndDate
          ? dateFnsFormat(new Date(this.item.EndDate), 'PPP').value
          : null;
      }
    },
    birthPlace: {
      get(): string | null {
        return this.item.ProductionLocations
          ? this.item.ProductionLocations[0]
          : null;
      }
    }
  },
  watch: {
    item: {
      handler(value: BaseItemDto): void {
        this.$route.meta.title = value.Name || '';

        this.$route.meta.backdrop.blurhash = getBlurhash(
          value,
          ImageType.Backdrop
        );
      },
      immediate: true,
      deep: true
    }
  }
});
</script>

<style lang="scss" scoped>
.person-image {
  border-radius: 50%;
}
</style>
