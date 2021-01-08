<template>
  <v-container v-if="currentQueue && currentQueue.length" fluid>
    <swiper
      ref="playbackSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
    >
      <swiper-slide v-for="item in currentQueue" :key="item.Id">
        <v-avatar ref="albumCover" tile size="65vh" color="primary">
          <v-img :src="getImageUrl(item)">
            <template #placeholder>
              <v-icon dark large>mdi-album</v-icon>
            </template>
          </v-img>
        </v-avatar>
      </swiper-slide>
    </swiper>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import { mapGetters, mapActions } from 'vuex';
import Swiper, { SwiperOptions } from 'swiper';
import { PlaybackStatus } from '~/store/playbackManager';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  data() {
    return {
      swiperOptions: {
        slidesPerView: 4,
        centeredSlides: true,
        initialSlide: 0,
        parallax: true,
        autoplay: false,
        effect: 'coverflow',
        coverflowEffect: {
          depth: 500,
          slideShadows: false,
          stretch: -200,
          rotate: 0
        },
        keyboard: true,
        a11y: true
      } as SwiperOptions,
      swiper: undefined as Swiper | undefined
    };
  },
  computed: {
    currentItemIndex: {
      get(): number {
        return this.$store.state.playbackManager.currentItemIndex;
      }
    },
    currentQueue: {
      get(): BaseItemDto[] {
        return this.$store.state.playbackManager.queue;
      }
    },
    backdropHash: {
      get(): string {
        return (
          this.getBlurhashHash(this.getCurrentItem(), ImageType.Primary) || ''
        );
      }
    },
    isPaused: {
      get(): boolean {
        return (
          this.$store.state.playbackManager.status === PlaybackStatus.paused
        );
      }
    },
    isPlaying: {
      get(): boolean {
        return (
          this.$store.state.playbackManager.status !== PlaybackStatus.stopped
        );
      }
    }
  },
  watch: {
    currentItemIndex(newIndex: number): void {
      this.swiper?.slideTo(newIndex);
      // HACK: Swiper has a bug where the slides might not always appear centered:
      // https://github.com/nolimits4web/Swiper/issues/886
      this.swiper?.update();
      this.setBackdrop({ hash: this.backdropHash });
    },
    isPlaying(newValue: boolean): void {
      if (!newValue) {
        this.$router.back();
      }
    }
  },
  beforeMount() {
    this.showNavDrawer({ showNavDrawer: false });
    this.setAppBarOpacity({ opaqueAppBar: false });
    this.setBackdropOpacity({ value: 0.5 });
    if (!this.isPlaying) {
      this.$router.back();
    }
    this.setMinimized({ minimized: false });
  },
  mounted() {
    this.swiper = (this.$refs.playbackSwiper as Vue).$swiper as Swiper;
    this.setBackdrop({ hash: this.backdropHash });
    this.swiper?.slideTo(this.currentItemIndex);
    // HACK: Swiper has a bug where the slides might not always appear centered:
    // https://github.com/nolimits4web/Swiper/issues/886
    this.swiper?.update();
  },
  beforeDestroy() {
    this.clearBackdrop();
    this.resetBackdropOpacity();
    this.setMinimized({ minimized: true });
  },
  destroyed() {
    this.showNavDrawer({ showNavDrawer: true });
    this.setAppBarOpacity({ opaqueAppBar: true });
  },
  methods: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapActions('playbackManager', ['setCurrentIndex', 'setMinimized']),
    ...mapActions('page', ['showNavDrawer', 'setAppBarOpacity']),
    ...mapActions('backdrop', [
      'setBackdrop',
      'setBackdropOpacity',
      'resetBackdropOpacity',
      'clearBackdrop'
    ]),
    onSlideChange(): void {
      const index = this.swiper?.realIndex || 0;
      this.setCurrentIndex({ index });
    },
    getImageUrl(item: BaseItemDto): string | undefined {
      const imageUrl = this.getImageUrlForElement(ImageType.Primary, { item });
      if (imageUrl) {
        return imageUrl;
      }

      return this.getImageUrlForElement(ImageType.Primary, {
        itemId: item.AlbumId
      });
    }
  }
});
</script>
