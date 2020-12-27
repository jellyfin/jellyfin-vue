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
        <div class="slide-backdrop">
          <blurhash-image
            :key="`${item.Id}-${reloadSentinel}`"
            :item="getRelatedItem(item)"
            :type="'Backdrop'"
          />
        </div>
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 py-0 py-md-4 align-end align-sm-center align-md-start"
          >
            <v-row>
              <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
                <p class="text-overline text-truncate mb-2 my-2">
                  {{ $t('homeHeader.items.recentlyAdded') }}
                </p>
                <v-img
                  v-if="
                    item.ParentLogoImageTag ||
                    (item.ImageTags && item.ImageTags.Logo)
                  "
                  :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
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
                  class="text-h4 text-sm-h4 text-truncate mb-2"
                >
                  {{ item.AlbumArtist }}
                </h1>
                <h1 v-else class="text-h3 text-sm-h2 text-truncate">
                  {{ item.Name }}
                </h1>
                <p
                  v-if="item.Type === 'Episode'"
                  class="mb-n1 text-truncate text-subtitle-2"
                >
                  {{ item.SeasonName }}
                  {{ $t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
                </p>
                <h2
                  v-else-if="item.Taglines && item.Taglines.length > 0"
                  class="text-truncate"
                >
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
                  class="text-h4 text-sm-h2 text-truncate"
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
                <v-btn
                  class="mr-2"
                  color="primary"
                  min-width="8em"
                  depressed
                  rounded
                  @click="play({ items: [item] })"
                >
                  {{ $t('play') }}
                </v-btn>
                <v-btn
                  min-width="12em"
                  outlined
                  rounded
                  nuxt
                  :to="`item/${item.Id}`"
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

export default Vue.extend({
  mixins: [htmlHelper, imageHelper],
  props: {
    items: {
      type: Array as () => BaseItemDto[],
      required: true
    },
    relatedItems: {
      type: Object as () => { [k: number]: BaseItemDto },
      required: true
    },
    slideDuration: {
      type: Number,
      default: 7000
    },
    swiperOptions: {
      type: Object as () => SwiperOptions,
      default: () => {
        return {
          initialSlide: 0,
          loop: true,
          autoplay: false,
          effect: 'slide'
        };
      }
    }
  },
  data() {
    return {
      reloadSentinel: 0,
      currentIndex: 0,
      isPaused: false
    };
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    getRelatedItem(item: BaseItemDto): BaseItemDto {
      const rItem = this.relatedItems[this.items.indexOf(item)];
      if (!rItem) {
        return item;
      }
      return rItem;
    },
    getOverview(item: BaseItemDto): string {
      if (item.Overview) {
        return this.sanitizeHtml(item.Overview);
      } else {
        return '';
      }
    },
    getLogo(item: BaseItemDto): string {
      const relatedItem = this.getRelatedItem(item);
      return this.getImageUrlForElement(ImageType.Logo, {
        itemId: relatedItem.Id
      });
    },
    // HACK: Vue-awesome-swiper seems to have a bug where the components inside of duplicated slides (when loop is enabled,
    // swiper creates a duplicate of the first one, so visually it looks like you started all over before repositioning all the DOM)
    // doesn't get the parameters passed correctly on components that calls to methods. Whenever the beginning or the end is reached,
    // we force a BlurhashImage reload to fix this by updating it's key.
    //
    // TODO: Revisit this once we are using the original Swiper.js library.
    forceReload(): void {
      this.reloadSentinel = 1;
      this.reloadSentinel = 0;
    },
    onSlideChange(): void {
      this.currentIndex = ((this.$refs.homeSwiper as Vue)
        .$swiper as Swiper).realIndex;
      if (
        this.currentIndex === 0 ||
        this.currentIndex === this.items.length - 1
      ) {
        this.forceReload();
      }
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
@import '~/assets/styles/HomeHeader.scss';
</style>
