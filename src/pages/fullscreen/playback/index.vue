<template>
  <v-col class="px-0">
    <v-scale-transition appear>
      <swiper
        v-if="getQueueItems"
        ref="playbackSwiper"
        class="d-flex justify-center align-center"
        :options="swiperOptions"
        @slideChange="onSlideChange"
        @sliderMove="update"
      >
        <swiper-slide
          v-for="item in getQueueItems"
          :key="item.Id"
          class="d-flex justify-center"
        >
          <div class="album-cover">
            <blurhash-image :item="item" @error="onImageError" />
          </div>
        </swiper-slide>
      </swiper>
    </v-scale-transition>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { ImageType } from '@jellyfin/client-axios';
import { mapGetters, mapActions, mapState } from 'vuex';
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
        autoplay: false,
        effect: 'coverflow',
        coverflowEffect: {
          depth: 500,
          slideShadows: false,
          rotate: 0,
          stretch: -400
        },
        keyboard: true,
        a11y: true
      } as SwiperOptions,
      swiper: undefined as Swiper | undefined
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getQueueItems', 'getCurrentItem']),
    ...mapState('playbackManager', ['currentItemIndex', 'status']),
    backdropHash: {
      get(): string {
        return this.getBlurhash(this.getCurrentItem, ImageType.Primary) || '';
      }
    },
    isPaused: {
      get(): boolean {
        return this.status === PlaybackStatus.Paused;
      }
    },
    isPlaying: {
      get(): boolean {
        return this.status !== PlaybackStatus.Stopped;
      }
    }
  },
  watch: {
    currentItemIndex(newIndex: number): void {
      this.swiper?.slideTo(newIndex);
      this.setBackdrop({ hash: this.backdropHash });
    },
    getQueueItems(): void {
      this.update();
    },
    isPlaying: {
      immediate: true,
      handler(newValue: boolean): void {
        if (!newValue) {
          this.$router.back();
        }
      }
    }
  },
  created() {
    this.swiperOptions.initialSlide = this.currentItemIndex;
    requestAnimationFrame(() => {
      this.setBackdrop({ hash: this.backdropHash });
    });
  },
  mounted() {
    this.setAppBarOpacity({ opaqueAppBar: false });
    this.setBackdropOpacity({ newOpacity: 0.5 });
    this.setMinimized({ minimized: false });
    this.swiper = (this.$refs.playbackSwiper as Vue).$swiper as Swiper;
  },
  destroyed() {
    this.clearBackdrop();
    this.resetBackdropOpacity();
    this.setMinimized({ minimized: true });
  },
  methods: {
    ...mapActions('playbackManager', ['setCurrentIndex', 'setMinimized']),
    ...mapActions('page', ['setAppBarOpacity']),
    ...mapActions('backdrop', [
      'setBackdrop',
      'setBackdropOpacity',
      'resetBackdropOpacity',
      'clearBackdrop'
    ]),
    onSlideChange(): void {
      const index = this.swiper?.realIndex || 0;

      if (this.getQueueItems[index]) {
        this.setCurrentIndex({ index });
      }
    },
    onImageError(): void {
      this.clearBackdrop();
    },
    update(): void {
      this.swiper?.update();
    }
  }
});
</script>

<style lang="scss" scoped>
.album-cover {
  position: relative;
  height: 65vh;
  min-width: 65vh;
  width: 65vh;
  user-select: none;
}
</style>
