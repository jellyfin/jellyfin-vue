<template>
  <div
    v-if="items.length > 0 && !$vuetify.breakpoint.mobile"
    class="swiperContainer"
  >
    <swiper
      ref="homeSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
      @touchStart="onTouch"
      @touchEnd="onTouch"
    >
      <swiper-slide v-for="item in items" :key="item.Id">
        <div
          class="slide-backdrop"
          :style="{
            backgroundImage: `url('${getBackdrop(item)}')`
          }"
        />
        <div class="slide-backdrop-overlay" />
        <div class="slide-content">
          <v-container class="mx-10 mt-5">
            <v-row>
              <v-col cols="5">
                <v-img
                  v-if="
                    item.ParentLogoImageTag ||
                    (item.ImageTags && item.ImageTags.Logo)
                  "
                  max-width="50%"
                  aspect-ratio="2.58"
                  contain
                  :src="getLogo(item)"
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
                <h2
                  v-if="item.Type === 'Episode'"
                  class="text-h4 text-truncate"
                >
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
                  class="my-2"
                />
                <p
                  class="d-none d-xl-block overview"
                  v-html="getOverview(item)"
                />
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
    </swiper>
    <swiper-progress-bar
      :pages="items.length"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      class="progressbar"
      @on-animation-end="onAnimationEnd"
      @on-progress-clicked="onProgressClicked"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Swiper, { SwiperOptions } from 'swiper';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper],
  data() {
    return {
      items: [] as BaseItemDto[],
      currentIndex: 0,
      pages: 10,
      slideDuration: 7000,
      isPaused: false,
      swiperOptions: {
        initialSlide: 0,
        loop: true,
        autoplay: false,
        effect: 'slide'
      } as SwiperOptions
    };
  },
  async beforeMount() {
    this.items = (
      await this.$api.userLibrary.getLatestMedia({
        userId: this.$auth.user.Id,
        limit: this.pages,
        fields: [ItemFields.Overview],
        enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
        imageTypeLimit: 1
      })
    ).data;
  },
  methods: {
    getBackdrop(item: BaseItemDto): string {
      // TODO: Improve the image mixin and move this there
      if (item.Type === 'Episode') {
        return `${this.$axios.defaults.baseURL}/Items/${item.SeriesId}/Images/Backdrop`;
      } else if (item.Type === 'MusicAlbum') {
        return `${this.$axios.defaults.baseURL}/Items/${item?.AlbumArtists?.[0].Id}/Images/Backdrop`;
      } else {
        return `${this.$axios.defaults.baseURL}/Items/${item.Id}/Images/Backdrop`;
      }
    },
    getLogo(item: BaseItemDto): string {
      // TODO: Improve the image mixin and move this there
      if (item.Type === 'Episode') {
        return `${this.$axios.defaults.baseURL}/Items/${item.SeriesId}/Images/Logo`;
      } else if (item.Type === 'MusicAlbum') {
        return `${this.$axios.defaults.baseURL}/Items/${item.ParentLogoItemId}/Images/Logo`;
      } else {
        return `${this.$axios.defaults.baseURL}/Items/${item.Id}/Images/Logo`;
      }
    },
    getOverview(item: BaseItemDto): string {
      if (item.Overview) {
        return this.sanitizeHtml(item.Overview);
      } else {
        return '';
      }
    },
    onSlideChange(): void {
      this.currentIndex = ((this.$refs.homeSwiper as Vue)
        .$swiper as Swiper).realIndex;
    },
    onTouch(): void {
      this.isPaused = !this.isPaused;
    },
    onAnimationEnd(): void {
      ((this.$refs.homeSwiper as Vue).$swiper as Swiper).slideNext();
    },
    onProgressClicked(index: number): void {
      ((this.$refs.homeSwiper as Vue).$swiper as Swiper).slideToLoop(index);
    }
  }
});
</script>

<style lang="scss" scoped>
.swiperContainer {
  min-width: 100%;
  min-height: 100%;
  position: relative;
  user-select: none;
}
.progressbar {
  position: absolute;
  z-index: 20;
}
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
      rgba(18, 18, 18, 1) 87%,
      rgba(18, 18, 18, 0) 100%
    ),
    linear-gradient(90deg, rgba(18, 18, 18, 1) 27%, rgba(18, 18, 18, 0) 47%);
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
