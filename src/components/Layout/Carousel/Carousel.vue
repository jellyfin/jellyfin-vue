<template>
  <div class="swiperContainer">
    <carousel-progress-bar
      v-if="progressbar && topProgress && slides > 0"
      :pages="slides"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      class="px-2 px-sm-4 progress-bar"
      hoverable
      @on-animation-end="onAnimationEnd"
      @on-progress-clicked="onProgressClicked"
    />
    <swiper
      ref="carousel"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
      @touchStart="onTouch"
      @touchEnd="onTouch"
    >
      <slot name="slides" />
    </swiper>
    <carousel-progress-bar
      v-if="progressbar && !topProgress && slides > 0"
      :pages="slides"
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

export default Vue.extend({
  props: {
    slides: {
      type: Number,
      required: true,
      default: 0
    },
    slideDuration: {
      type: Number,
      default: 7000
    },
    progressbar: {
      type: Boolean,
      default: false
    },
    topProgress: {
      type: Boolean,
      default: false
    },
    pageBackdrop: {
      type: Boolean,
      default: false
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
    this.swiper = (this.$refs.carousel as Vue).$swiper as Swiper;
  },
  methods: {
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

      // Propagate events to children
      this.$emit('onSlideChange', this.currentIndex, this.swiper);
    },
    onTouch(): void {
      this.isPaused = !this.isPaused;

      // Propagate events to children
      this.$emit('onTouch', this.isPaused, this.swiper);
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

.slide-backdrop {
  background-color: #{map-get($material-dark, 'menus')};
}
</style>
