<template>
  <v-col class="px-0">
    <v-scale-transition appear>
      <swiper
        v-if="playbackManager.getQueueItems"
        ref="playbackSwiper"
        class="d-flex justify-center align-center"
        :options="swiperOptions"
        @slideChange="onSlideChange"
        @sliderMove="update"
      >
        <swiper-slide
          v-for="item in playbackManager.getQueueItems"
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
import { mapStores } from 'pinia';
import { ImageType } from '@jellyfin/client-axios';
import Swiper, { SwiperOptions } from 'swiper';
import { getBlurhash } from '~/utils/images';
import { pageStore, playbackManagerStore } from '~/store';

export default Vue.extend({
  meta: {
    backdrop: { opacity: 0.5 },
    transparentLayout: true
  },
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
    ...mapStores(pageStore, playbackManagerStore),
    backdropHash(): string | undefined {
      return this.playbackManager.getCurrentItem
        ? getBlurhash(this.playbackManager.getCurrentItem, ImageType.Primary)
        : '';
    }
  },
  watch: {
    'playbackManager.currentItemIndex'(newIndex: number): void {
      this.swiper?.slideTo(newIndex);
      this.page.backdrop.blurhash = this.backdropHash;
    },
    'playbackManager.getQueueItems'(): void {
      this.update();
    },
    'playbackManager.isPlaying': {
      immediate: true,
      handler(newValue: boolean): void {
        if (!newValue) {
          this.$router.back();
        }
      }
    }
  },
  created() {
    this.swiperOptions.initialSlide =
      this.playbackManager.currentItemIndex || 0;
    requestAnimationFrame(() => {
      this.page.backdrop.blurhash = this.backdropHash;
    });
  },
  mounted() {
    this.swiper = (this.$refs.playbackSwiper as Vue).$swiper as Swiper;
    this.playbackManager.setMinimized(false);
  },
  destroyed() {
    this.playbackManager.setMinimized(true);
  },
  methods: {
    onSlideChange(): void {
      const index = this.swiper?.realIndex || 0;

      if (this.playbackManager.getQueueItems[index]) {
        this.playbackManager.setCurrentIndex(index);
      }
    },
    onImageError(): void {
      this.page.clearBackdrop();
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
