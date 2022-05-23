<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start">
        <v-col cols="6" sm="3" class="d-flex flex-row">
          <v-responsive aspect-ratio="1" class="overflow-visible">
            <v-avatar
              color="card"
              width="100%"
              height="100%"
              class="elevation-2"
            >
              <blurhash-image :item="item" />
            </v-avatar>
          </v-responsive>
        </v-col>
        <v-col cols="12" sm="7">
          <v-row justify="d-flex flex-column">
            <div class="ml-sm-4 d-flex flex-column">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
              >
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
          <v-tabs v-model="activeTab" background-color="transparent">
            <v-tab :key="0" :disabled="!discographyIds.length">
              {{ $t('item.artist.discography') }}
            </v-tab>
            <v-tab :key="1" :disabled="!appearancesIds.length">
              {{ $t('item.artist.appearsOn') }}
            </v-tab>
            <v-tab :key="2" :disabled="!musicVideoIds.length">
              {{ $t('item.artist.videos') }}
            </v-tab>
            <v-tab :key="3" :disabled="!artistBackdrop.tag && !overview">
              {{ $t('item.artist.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="activeTab" class="transparent">
            <v-tab-item :key="0">
              <v-row no-gutters>
                <v-col cols="12" class="my-6">
                  <v-row v-for="album in discography" :key="album.Id">
                    <v-col cols="12">
                      <div class="d-flex flex-column">
                        <v-row>
                          <v-col lg="2" sm="1">
                            <card :item="album" overlay link />
                          </v-col>
                          <v-col class="py-2">
                            <div
                              class="text-subtitle-1 text--secondary font-weight-medium"
                            >
                              {{ album.ProductionYear }}
                            </div>
                            <nuxt-link
                              class="link font-weight-bold text-h6 text-md-h4"
                              tag="h2"
                              :to="getItemDetailsLink(album)"
                            >
                              {{ album.Name }}
                            </nuxt-link>
                          </v-col>
                        </v-row>
                        <v-row v-if="$vuetify.breakpoint.mdAndUp" class="my-2">
                          <v-col>
                            <track-list :item="album" />
                          </v-col>
                        </v-row>
                      </div>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :key="1">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="appearances" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="2">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="musicVideos" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="3">
              <v-container>
                <v-row>
                  <v-col>
                    <v-col cols="12" md="7">
                      <span class="item-overview" v-text="item.Overview" />
                    </v-col>
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
import Vue from 'vue';
import { mapStores } from 'pinia';
import {
  BaseItemDto,
  ImageType,
  ItemFields,
  SortOrder
} from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import htmlHelper from '~/mixins/htmlHelper';
import { getImageInfo, getBlurhash, ImageUrlInfo } from '~/utils/images';
import timeUtils from '~/mixins/timeUtils';
import itemHelper from '~/mixins/itemHelper';
import { isValidMD5 } from '~/utils/items';
import { pageStore, authStore } from '~/store';

export default Vue.extend({
  mixins: [htmlHelper, timeUtils, itemHelper],
  meta: {
    backdrop: true,
    transparentAppBar: true
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

    const discography = (
      await $api.items.getItems({
        albumArtistIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['MusicAlbum'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    const appearances = (
      await $api.items.getItems({
        contributingArtistIds: [itemId],
        excludeItemIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['MusicAlbum'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    const musicVideo = (
      await $api.items.getItems({
        artistIds: [itemId],
        sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
        sortOrder: [SortOrder.Descending],
        recursive: true,
        includeItemTypes: ['MusicVideo'],
        fields: Object.values(ItemFields),
        userId: auth.currentUserId
      })
    ).data.Items;

    let activeTab = 3;

    if (discography?.length) {
      activeTab = 0;
    } else if (appearances?.length) {
      activeTab = 1;
    } else if (musicVideo?.length) {
      activeTab = 2;
    }

    return { activeTab, discography, appearances, musicVideo, item };
  },
  data() {
    return {
      activeTab: 0,
      discographyIds: [] as BaseItemDto[],
      appearancesIds: [] as BaseItemDto[],
      musicVideoIds: [] as BaseItemDto[],
      item: {} as BaseItemDto
    };
  },
  head() {
    return {
      title: this.page.title
    };
  },
  computed: {
    ...mapStores(pageStore),
    overview(): string {
      if (this.item?.Overview) {
        return this.sanitizeHtml(this.item.Overview);
      } else {
        return '';
      }
    },
    artistBackdrop(): ImageUrlInfo {
      return getImageInfo(this.item, { preferBackdrop: true });
    }
  },
  watch: {
    item: {
      immediate: true,
      deep: true,
      handler(val: BaseItemDto): void {
        this.page.title = val.Name || '';

        this.page.backdrop.blurhash = getBlurhash(val, ImageType.Backdrop);
      }
    }
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
