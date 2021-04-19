<template>
  <div class="swiperContainer">
    <swiper
      ref="homeSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
      @touchStart="onTouch"
      @touchEnd="onTouch"
    >
      <swiper-slide v-for="item in items" :key="item.Id">
        <div class="slide-backdrop" data-swiper-parallax="-100">
          <div class="default-icon" />
          <blurhash-image
            :key="`${item.Id}-image`"
            :item="item"
            :type="'Backdrop'"
            :icon-size="$vuetify.breakpoint.mdAndUp ? '256' : '128'"
          />
        </div>
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 py-md-4 align-end align-sm-center align-md-start"
          >
            <v-row>
              <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
                <p class="text-overline text-truncate mb-2 my-2">
                  {{ $t('homeHeader.items.recentlyAdded') }}
                </p>
                <home-header-album-title
                  v-if="item.Type === 'MusicAlbum'"
                  class="mb-sm-n1"
                  :item="item"
                  :logo="getLogo(item)"
                />
                <home-header-episode-title
                  v-else-if="item.Type === 'Episode'"
                  :item="item"
                  :logo="getLogo(item)"
                />
                <home-header-generic-title
                  v-else
                  :item="item"
                  :logo="getLogo(item)"
                />
                <media-info
                  :item="item"
                  year
                  tracks
                  runtime
                  rating
                  class="mb-3"
                  data-swiper-parallax="-100"
                />
                <play-button :items="[item]" data-swiper-parallax="-100" />
                <v-btn
                  min-width="12em"
                  outlined
                  rounded
                  nuxt
                  data-swiper-parallax="-100"
                  :to="getItemDetailsLink(item)"
                >
                  {{ $t('viewDetails') }}
                </v-btn>
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
      class="px-2 px-sm-4 progress-bar"
      hoverable
      @on-animation-end="onAnimationEnd"
      @on-progress-clicked="onProgressClicked"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Swiper, { SwiperOptions } from 'swiper';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, itemHelper],
  props: {
    items: {
      type: Array as () => BaseItemDto[],
      required: true
    },
    slideDuration: {
      type: Number,
      default: 10000
    },
    swiperOptions: {
      type: Object as () => SwiperOptions,
      default: (): SwiperOptions => {
        return {
          initialSlide: 0,
          loop: false,
          parallax: true,
          autoplay: false,
          effect: 'fade',
          fadeEffect: {
            crossFade: true
          },
          keyboard: true,
          a11y: true
        };
      }
    }
  },
  data() {
    return {
      currentIndex: 0 as number | undefined,
      isPaused: false,
      swiper: undefined as Swiper | undefined
    };
  },
  mounted() {
    this.swiper = (this.$refs.homeSwiper as Vue).$swiper as Swiper;

    const hash = this.getBlurhash(this.items[0], ImageType.Backdrop);

    this.setBackdrop({ hash });
  },
  activated() {
    this.onSlideChange();
  },
  deactivated() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getOverview(item: BaseItemDto): string {
      if (item.Overview) {
        return this.sanitizeHtml(item.Overview);
      } else {
        return '';
      }
    },
    getLogo(item: BaseItemDto): string | undefined {
      return this.getImageInfo(item, { preferLogo: true }).url;
    },
    onSlideChange(): void {
      this.currentIndex = this.swiper?.realIndex;

      const hash =
        this.getBlurhash(
          this.items[this.currentIndex as number],
          ImageType.Backdrop
        ) || '';

      this.setBackdrop({ hash });
    },
    onTouch(): void {
      this.isPaused = !this.isPaused;
    },
    // swiper has several issues with looped elements
    // rather than try to work around the bugs we have reimplemented looping below
    // https://github.com/nolimits4web/swiper/issues/2629
    // https://github.com/surmon-china/vue-awesome-swiper/issues/483
    onAnimationEnd(): void {
      if (this.swiper?.isEnd) {
        this.swiper?.slideTo(0);
      } else {
        this.swiper?.slideNext();
      }
    },
    onProgressClicked(index: number): void {
      this.swiper?.slideTo(index);
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/styles/HomeHeader.scss';

.slide-backdrop {
  background-color: #{map-get($material-dark, 'menus')};
}
</style>
