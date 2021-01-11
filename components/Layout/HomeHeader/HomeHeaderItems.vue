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
          <div class="default-icon"></div>
          <blurhash-image
            :key="`${item.Id}-image`"
            :item="getRelatedItem(item)"
            :type="'Backdrop'"
          >
            <template #placeholder>
              <v-icon
                :size="$vuetify.breakpoint.mdAndUp ? 256 : 128"
                class="text--disabled default-icon"
                color="white"
                dark
              >
                {{ getItemIcon(item) }}
              </v-icon>
            </template>
          </blurhash-image>
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
                  data-swiper-parallax="-300"
                  :alt="item.Name"
                  :src="getLogo(item)"
                />
                <h1
                  v-else-if="item.Type === 'Episode'"
                  class="text-h2 text-truncate mb-2"
                  data-swiper-parallax="-300"
                >
                  {{ item.SeriesName }}
                </h1>
                <h1
                  v-else-if="item.Type === 'MusicAlbum'"
                  class="text-h4 text-sm-h4 text-truncate mb-2"
                  data-swiper-parallax="-300"
                >
                  {{ item.AlbumArtist }}
                </h1>
                <h1
                  v-else
                  class="text-h3 text-sm-h2 text-truncate"
                  data-swiper-parallax="-300"
                >
                  {{ item.Name }}
                </h1>
                <p
                  v-if="item.Type === 'Episode'"
                  class="mb-n1 text-truncate text-subtitle-2"
                  data-swiper-parallax="-200"
                >
                  {{ item.SeasonName }}
                  {{ $t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
                </p>
                <h2
                  v-else-if="item.Taglines && item.Taglines.length > 0"
                  class="text-truncate"
                  data-swiper-parallax="-200"
                >
                  {{ item.Taglines[0] }}
                </h2>
                <h2
                  v-if="item.Type === 'Episode'"
                  class="text-h4 text-truncate"
                  data-swiper-parallax="-200"
                >
                  {{ item.Name }}
                </h2>
                <h2
                  v-else-if="item.Type === 'MusicAlbum'"
                  class="text-h4 text-sm-h2 text-truncate"
                  data-swiper-parallax="-200"
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
                  data-swiper-parallax="-100"
                />
                <v-btn
                  v-if="canPlay(item)"
                  class="mr-2"
                  color="primary"
                  min-width="8em"
                  depressed
                  rounded
                  data-swiper-parallax="-100"
                  @click="play({ items: [item] })"
                >
                  {{ $t('play') }}
                </v-btn>
                <v-btn
                  min-width="12em"
                  outlined
                  rounded
                  nuxt
                  data-swiper-parallax="-100"
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
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, itemHelper],
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
      default: (): SwiperOptions => {
        return {
          initialSlide: 0,
          loop: true,
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
    const hash = this.getBlurhashHash(this.items[0], ImageType.Backdrop);
    this.setBackdrop({ hash });
  },
  beforeDestroy() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('backdrop', [
      'setBackdrop',
      'clearBackdrop',
      'setBackdropOpacity',
      'resetBackdropOpacity'
    ]),
    getItemIcon(item: BaseItemDto): string {
      switch (item.Type) {
        case 'Audio':
          return 'mdi-music-note';
        case 'Book':
          return 'mdi-book-open-page-variant';
        case 'BoxSet':
          return 'mdi-folder-multiple';
        case 'Folder':
        case 'CollectionFolder':
          return 'mdi-folder';
        case 'Movie':
          return 'mdi-filmstrip';
        case 'MusicAlbum':
          return 'mdi-album';
        case 'MusicArtist':
        case 'Person':
          return 'mdi-account';
        case 'PhotoAlbum':
          return 'mdi-image-multiple';
        case 'Playlist':
          return 'mdi-playlist-play';
        case 'Series':
          return 'mdi-television-classic';
        default:
          return '';
      }
    },
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
    getLogo(item: BaseItemDto): string | undefined {
      const relatedItem = this.getRelatedItem(item);
      return this.getImageUrlForElement(ImageType.Logo, {
        itemId: relatedItem.Id
      });
    },
    // HACK: Swiper seems to have a bug where the components inside of duplicated slides (when loop is enabled,
    // swiper creates a duplicate of the first one, so visually it looks like you started all over before repositioning all the DOM)
    // doesn't get the parameters passed correctly on components that calls to methods. Whenever the beginning or the end is reached,
    // we force a loop reload to fix this.
    //
    // See https://github.com/nolimits4web/swiper/issues/2629 and https://github.com/surmon-china/vue-awesome-swiper/issues/483
    onSlideChange(): void {
      this.currentIndex = this.swiper?.realIndex;
      if (this.swiper?.isBeginning || this.swiper?.isEnd) {
        this.swiper?.updateSlides();
      }
      const hash =
        this.getBlurhashHash(
          this.items[this.currentIndex as number],
          ImageType.Backdrop
        ) || '';
      this.setBackdrop({ hash });
    },
    onTouch(): void {
      this.isPaused = !this.isPaused;
    },
    onAnimationEnd(): void {
      this.swiper?.slideNext();
    },
    onProgressClicked(index: number): void {
      this.swiper?.slideToLoop(index);
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/styles/HomeHeader.scss';
</style>
