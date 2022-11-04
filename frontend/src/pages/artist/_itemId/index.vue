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
            <v-tab :key="0" :disabled="!discography.length">
              {{ $t('item.artist.discography') }}
            </v-tab>
            <v-tab :key="1" :disabled="!albums.length">
              {{ $t('item.artist.albums') }}
            </v-tab>
            <v-tab :key="2" :disabled="!eps.length">
              {{ $t('item.artist.eps') }}
            </v-tab>
            <v-tab :key="3" :disabled="!singles.length">
              {{ $t('item.artist.singles') }}
            </v-tab>
            <v-tab :key="4" :disabled="!appearances.length">
              {{ $t('item.artist.appearsOn') }}
            </v-tab>
            <v-tab :key="5" :disabled="!musicVideo.length">
              {{ $t('item.artist.videos') }}
            </v-tab>
            <v-tab :key="6" :disabled="!artistBackdrop.tag && !overview">
              {{ $t('item.artist.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs v-model="activeTab" class="bg-transparent">
            <v-tab :key="0">
              <artist-tab :releases="discography" />
            </v-tab>
            <v-tab :key="1">
              <artist-tab :releases="albums" />
            </v-tab>
            <v-tab :key="2">
              <artist-tab :releases="eps" />
            </v-tab>
            <v-tab :key="3">
              <artist-tab :releases="singles" />
            </v-tab>
            <v-tab :key="4">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="appearances" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="5">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="musicVideos" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab>
            <v-tab :key="6">
              <v-container>
                <v-row>
                  <v-col>
                    <v-col cols="12" md="7">
                      <span class="item-overview" v-text="item.Overview" />
                    </v-col>
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
import { mapStores } from 'pinia';
import {
  BaseItemDto,
  ImageType,
  ItemFields,
  SortOrder
} from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { sanitizeHtml } from '~/utils/html';
import { getImageInfo, getBlurhash, ImageUrlInfo } from '~/utils/images';
import { getItemDetailsLink, isValidMD5 } from '~/utils/items';
import { pageStore, authStore } from '~/store';
import { msToTicks } from '~/utils/time';

export default defineComponent({
  meta: {
    backdrop: true,
    transparentLayout: true
  },
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $api }) {
    const albumBreakpoints = {
      singleMsMaxLength: 600000,
      epMsMaxLength: 1800000
    };
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

    const singles = discography?.filter(
      (album: BaseItemDto) =>
        (album?.RunTimeTicks || album?.CumulativeRunTimeTicks || 0) <=
        msToTicks(albumBreakpoints.singleMsMaxLength)
    );
    const eps = discography?.filter(
      (album: BaseItemDto) =>
        (album?.RunTimeTicks || album?.CumulativeRunTimeTicks || 0) >
          msToTicks(albumBreakpoints.singleMsMaxLength) &&
        (album?.RunTimeTicks || album?.CumulativeRunTimeTicks || 0) <=
          msToTicks(albumBreakpoints.epMsMaxLength)
    );
    const albums = discography?.filter(
      (album: BaseItemDto) =>
        (album?.RunTimeTicks || album?.CumulativeRunTimeTicks || 0) >
        msToTicks(albumBreakpoints.epMsMaxLength)
    );

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

      if (albums?.length) {
        activeTab = 1;
      }
    } else if (appearances?.length) {
      activeTab = 4;
    } else if (musicVideo?.length) {
      activeTab = 5;
    }

    return {
      activeTab,
      discography,
      albums,
      eps,
      singles,
      appearances,
      musicVideo,
      item
    };
  },
  data() {
    return {
      activeTab: 0,
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
        return sanitizeHtml(this.item.Overview);
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
  },
  methods: {
    getItemDetailsLink
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
