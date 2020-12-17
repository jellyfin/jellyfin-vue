<template>
  <swiper
    v-if="items.length > 0 && !$vuetify.breakpoint.mobile && loaded"
    class="swiper"
    :options="swiperOptions"
  >
    <swiper-slide v-for="item in items" :key="item.Id">
      <blurhash-image
        class="slide-backdrop"
        :item="getRelatedItem(item)"
        :type="'Backdrop'"
      />
      <div class="slide-backdrop-overlay" />
      <div class="slide-content">
        <v-container class="mx-10 mt-5">
          <v-row>
            <v-col cols="5">
              <blurhash-image
                v-if="item.ImageTags && item.ImageTags.Logo"
                :item="getRelatedItem(item)"
                :type="'Logo'"
                class="contain"
              />
              <h1
                v-else-if="item.Type === 'Episode'"
                class="text-h2 text-truncate mb-2"
              >
                {{ item.SeriesName }}
              </h1>
              <h1
                v-else-if="item.Type === 'MusicAlbum'"
                class="text-h4 text-truncate mb-2"
              >
                {{ item.AlbumArtist }}
              </h1>
              <h1 v-else class="text-h2 text-truncate">{{ item.Name }}</h1>
              <p
                v-if="item.Type === 'Episode'"
                class="mb-n1 text-truncate text-subtitle-2"
              >
                {{ item.SeasonName }}
                {{ $t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
              </p>
              <h2 v-else-if="item.Taglines" class="text-truncate">
                {{ item.Taglines[0] }}
              </h2>
              <h2 v-if="item.Type === 'Episode'" class="text-h4 text-truncate">
                {{ item.Name }}
              </h2>
              <h2
                v-else-if="item.Type === 'MusicAlbum'"
                class="text-h2 text-truncate"
              >
                {{ item.Name }}
              </h2>
              <media-info
                :item="item"
                year
                tracks
                runtime
                rating
                class="mt-2"
              />
              <!-- eslint-disable-next-line vue/no-v-html -->
              <p class="mt-2" v-html="getOverview(item)" />
              <v-btn
                class="mr-2"
                color="primary"
                min-width="8em"
                depressed
                rounded
                nuxt
                :to="`item/${item.Id}/play`"
                >{{ $t('play') }}</v-btn
              >
              <v-btn
                min-width="12em"
                outlined
                rounded
                nuxt
                :to="`item/${item.Id}`"
                >{{ $t('viewDetails') }}</v-btn
              >
            </v-col>
          </v-row>
        </v-container>
      </div>
    </swiper-slide>
    <div slot="pagination" class="swiper-pagination"></div>
  </swiper>
</template>

<script lang="ts">
import Vue from 'vue';
import { SwiperOptions } from 'swiper';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper],
  data() {
    return {
      items: [] as BaseItemDto[],
      relatedItems: {} as { [k: number]: BaseItemDto },
      loaded: false,
      swiperOptions: {
        autoplay: {
          delay: 20000
        },
        initialSlide: 0,
        loop: true,
        effect: 'slide',
        pagination: {
          el: '.swiper-pagination'
        }
      } as SwiperOptions
    };
  },
  async beforeMount() {
    this.items = (
      await this.$api.userLibrary.getLatestMedia({
        userId: this.$auth.user.Id,
        limit: 10,
        fields: [ItemFields.Overview],
        enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
        imageTypeLimit: 1
      })
    ).data;

    for (const [key, i] of this.items.entries()) {
      let id: string;
      if (i.Type === 'Episode' && i.SeriesId) {
        id = i?.SeriesId as string;
      } else if (i.Type === 'MusicAlbum') {
        id = i?.AlbumArtists?.[0].Id as string;
      } else if (i.ParentLogoItemId) {
        id = i?.ParentLogoItemId as string;
      } else {
        continue;
      }

      const itemData = (
        await this.$api.userLibrary.getItem({
          userId: this.$auth.user.Id,
          itemId: id
        })
      ).data;

      this.relatedItems[key] = itemData;
    }
    this.loaded = true;
  },
  methods: {
    getRelatedItem(item: BaseItemDto): BaseItemDto {
      return this.relatedItems[this.items.indexOf(item)];
    },
    getOverview(item: BaseItemDto): string {
      if (item.Overview) {
        return this.sanitizeHtml(item.Overview);
      } else {
        return '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.swiper {
  margin-top: -64px;
  margin-bottom: -128px !important;
}

.slide-backdrop {
  padding-bottom: 46.25%;
  background-position: right center;
  background-size: contain;
  background-repeat: no-repeat;
  box-sizing: border-box;
  mask-image: linear-gradient(
      180deg,
      rgba(18, 18, 18, 1) 60%,
      rgba(18, 18, 18, 0) 100%
    ),
    linear-gradient(90deg, rgba(18, 18, 18, 1) 20%, rgba(18, 18, 18, 0) 70%);
  mask-composite: subtract;
  -webkit-mask-composite: source-out; // This is needed due to autoprefixed not converting subtract to the proper webkit equivalent
  z-index: 1;
}

.slide-backdrop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 1;
}

.slide-content {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 2;
}
</style>
