<template>
  <div class="swiperContainer">
    <carousel-progress-bar
      v-if="progressBar && topProgressBar && slides > 0"
      :pages="slides"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      :class="useResponsiveClasses('px-2 px-sm-4 progress-bar')"
      hoverable
      @on-animation-end="onAnimationEnd"
      @on-progress-clicked="onProgressClicked" />
    <swiper
      :modules="modules"
      :class="useResponsiveClasses('swiper')"
      :initial-slide="0"
      loop
      parallax
      autoplay
      effect="fade"
      :fade-effect="{ crossFade: true }"
      keyboard
      a11y
      @swiper="setControlledSwiper"
      @slide-change="onSlideChange"
      @touch-start="onTouch"
      @touch-end="onTouch">
      <slot name="slides" />
    </swiper>
    <carousel-progress-bar
      v-if="progressBar && !topProgressBar && slides > 0"
      :pages="slides"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      :class="useResponsiveClasses('px-2 px-sm-4 progress-bar')"
      hoverable
      @on-animation-end="onAnimationEnd"
      @on-progress-clicked="onProgressClicked" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { A11y, Parallax, EffectFade, Keyboard } from 'swiper';
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/keyboard';
import 'swiper/css/parallax';
import 'swiper/css/a11y';
import { Swiper } from 'swiper/vue';
import { useResponsiveClasses } from '@/composables';

withDefaults(
  defineProps<{
    slides: number;
    slideDuration?: number;
    progressBar?: boolean;
    topProgressBar?: boolean;
    pageBackdrop?: boolean;
  }>(),
  {
    slideDuration: 7000,
    progressBar: false,
    topProgressBar: false,
    pageBackdrop: false
  }
);

const emit = defineEmits<{
  (e: 'on-slide-change', currentIndex: number, swiper: SwiperType): void;
  (e: 'on-touch', isPaused: boolean, swiper: SwiperType): void;
}>();

const modules = [A11y, Parallax, EffectFade, Keyboard];

const currentIndex = ref(0);
const isPaused = ref(false);
const swiperInstance = ref<SwiperType>();
const setControlledSwiper = (instance: SwiperType): void => {
  swiperInstance.value = instance;
};

/**
 * HACK: Swiper seems to have a bug where the components inside of duplicated slides (when loop is enabled,
 * swiper creates a duplicate of the first one, so visually it looks like you started all over before repositioning all the DOM)
 * doesn't get the parameters passed correctly on components that calls to methods. Whenever the beginning or the end is reached,
 * we force a loop reload to fix this.
 *
 * See https://github.com/nolimits4web/swiper/issues/2629 and https://github.com/surmon-china/vue-awesome-swiper/issues/483
 */
function onSlideChange(): void {
  currentIndex.value = swiperInstance.value?.realIndex || 0;

  if (swiperInstance.value?.isBeginning || swiperInstance.value?.isEnd) {
    swiperInstance.value?.updateSlides();
  }

  // Propagate events to children
  emit(
    'on-slide-change',
    currentIndex.value,
    swiperInstance.value as SwiperType
  );
}
/**
 * Handle touch events
 */
function onTouch(): void {
  isPaused.value = !isPaused.value;

  // Propagate events to children
  emit('on-touch', isPaused.value, swiperInstance.value as SwiperType);
}

/**
 * Handle animation end from progress bars
 */
function onAnimationEnd(): void {
  swiperInstance.value?.slideNext();
}

/**
 * Handle click on progress bar
 */
function onProgressClicked(index: number): void {
  swiperInstance.value?.slideToLoop(index);
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/Carousel/index.scss';
</style>
