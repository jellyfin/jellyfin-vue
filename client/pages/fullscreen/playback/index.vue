<template>
  <v-col class="px-0">
    <v-scale-transition appear>
      <swiper
        v-if="currentQueue"
        ref="playbackSwiper"
        class="d-flex justify-center align-center"
        :options="swiperOptions"
        @slideChange="onSlideChange"
        @sliderMove="update"
      >
        <swiper-slide
          v-for="item in currentQueue"
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
    ...mapGetters('playbackManager', ['getCurrentItem']),
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
        return this.getBlurhash(this.getCurrentItem, ImageType.Primary) || '';
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
      this.setBackdrop({ hash: this.backdropHash });
    },
    currentQueue(): void {
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
  activated() {
    this.setAppBarOpacity({ opaqueAppBar: false });
    this.setBackdropOpacity({ newOpacity: 0.5 });
    this.setMinimized({ minimized: false });
  },
  mounted() {
    this.swiper = (this.$refs.playbackSwiper as Vue).$swiper as Swiper;
  },
  deactivated() {
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

      if (this.currentQueue[index]) {
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
