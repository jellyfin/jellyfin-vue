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
          <v-tabs v-model="activeTab" background-color="transparent">
            <v-tab :key="0" :disabled="!movies.length">
              {{ $t('item.person.movies') }}
            </v-tab>
            <v-tab :key="1" :disabled="!series.length">
              {{ $t('item.person.shows') }}
            </v-tab>
            <v-tab :key="2" :disabled="!books.length">
              {{ $t('item.person.books') }}
            </v-tab>
            <v-tab :key="3" :disabled="!photos.length">
              {{ $t('item.person.photos') }}
            </v-tab>
            <v-tab :key="4" :disabled="!item.Overview">
              {{ $t('item.person.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="activeTab" class="transparent">
            <v-tab-item :key="0">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="movies" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="1">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="series" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="2">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="books" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="3">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="photos" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="4">
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
            </v-tab-item>
          </v-tabs-items>
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
import { mapStores } from 'pinia';
import {
  BaseItemDto,
  ImageType,
  ItemFields,
  SortOrder
} from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { getBlurhash } from '~/utils/images';
import { isValidMD5 } from '~/utils/items';
import { authStore, pageStore } from '~/store';

export default defineComponent({
  meta: {
    backdrop: true,
    transparentLayout: true
  },
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $api }) {
    const auth = authStore();

    const itemId = params.itemId;
    const item = (
      await $api.userLibrary.getItem({
        userId: auth.currentUserId,
        itemId
      })
    ).data;

    const movies = (
      await $api.items.getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['Movie'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    const series = (
      await $api.items.getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['Series'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    const books = (
      await $api.items.getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['Book'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    const photos = (
      await $api.items.getItems({
        personIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['Photo'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
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
  data() {
    return {
      activeTab: 0,
      movies: [] as BaseItemDto[],
      series: [] as BaseItemDto[],
      books: [] as BaseItemDto[],
      photos: [] as BaseItemDto[],
      item: {} as BaseItemDto
    };
  },
  computed: {
    ...mapStores(pageStore),
    birthDate(): Date | null {
      if (this.item.PremiereDate) {
        return this.$dateFns.format(new Date(this.item.PremiereDate), 'PPP', {
          locale: this.$i18n.locale
        });
      } else {
        return null;
      }
    },
    deathDate: {
      get(): Date | null {
        if (this.item.EndDate) {
          return this.$dateFns.format(new Date(this.item.EndDate), 'PPP', {
            locale: this.$i18n.locale
          });
        } else {
          return null;
        }
      }
    },
    birthPlace: {
      get(): string | null {
        if (this.item.ProductionLocations) {
          return this.item.ProductionLocations[0];
        } else {
          return null;
        }
      }
    }
  },
  watch: {
    item: {
      handler(val: BaseItemDto): void {
        this.page.title = val.Name || '';

        this.page.backdrop.blurhash = getBlurhash(val, ImageType.Backdrop);
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
