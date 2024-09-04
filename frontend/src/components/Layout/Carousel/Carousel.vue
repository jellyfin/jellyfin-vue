<template>
  <div class="swiper-parent uno-select-none">
    <CarouselProgressBar
      v-if="progressBar && topProgressBar && slides > 0"
      :pages="slides"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      :class="useResponsiveClasses('px-2 px-sm-4 progress-bar')"
      hoverable
      @animation-end="onAnimationEnd"
      @progress-clicked="onProgressClicked" />
    <Swiper
      :modules="modules"
      :class="useResponsiveClasses('swiper-el')"
      effect="fade"
      :fade-effect="{ crossFade: true }"
      autoplay
      a11y
      loop
      parallax
      keyboard
      @swiper="(swiper) => swiperInstance = swiper"
      @real-index-change="onSlideChange"
      @touch-start="onTouch"
      @touch-end="onTouch">
      <slot name="slides" />
    </Swiper>
    <CarouselProgressBar
      v-if="progressBar && !topProgressBar && slides > 0"
      :pages="slides"
      :current-index="currentIndex"
      :duration="slideDuration"
      :paused="isPaused"
      :class="useResponsiveClasses('px-2 px-sm-4 progress-bar')"
      hoverable
      @animation-end="onAnimationEnd"
      @progress-clicked="onProgressClicked" />
  </div>
</template>

<script setup lang="ts">
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/effect-fade';
import 'swiper/css/keyboard';
import 'swiper/css/parallax';
import 'swiper/css/virtual';
import { A11y, EffectFade, Keyboard, Parallax, Virtual } from 'swiper/modules';
import { Swiper } from 'swiper/vue';
import { ref, shallowRef } from 'vue';
import { useResponsiveClasses } from '@/composables/use-responsive-classes';

const { slideDuration = 7000, progressBar, topProgressBar } = defineProps<{
  slides: number;
  /**
   * In milliseconds
   */
  slideDuration?: number;
  progressBar?: boolean;
  topProgressBar?: boolean;
}>();

const emit = defineEmits<{
  'on-slide-change': [currentIndex: number, swiper: SwiperType];
  'on-touch': [isPaused: boolean, swiper: SwiperType];
}>();

const modules = [A11y, Parallax, EffectFade, Keyboard, Virtual];

const currentIndex = ref(0);
const isPaused = ref(false);
const swiperInstance = shallowRef<SwiperType>();

/**
 * Handle slide changes
 */
function onSlideChange(): void {
  if (swiperInstance.value) {
    currentIndex.value = swiperInstance.value.realIndex;
    emit('on-slide-change', currentIndex.value, swiperInstance.value);
  }
}
/**
 * Handle touch events
 */
function onTouch(): void {
  if (swiperInstance.value) {
    isPaused.value = !isPaused.value;
    emit('on-touch', isPaused.value, swiperInstance.value);
  }
}

/**
 * Handle animation end from progress bars
 */
function onAnimationEnd(): void {
  if (swiperInstance.value) {
    swiperInstance.value.allowSlideNext = true;
    swiperInstance.value.slideNext();
  }
}

/**
 * Handle click on progress bar
 */
function onProgressClicked(index: number): void {
  swiperInstance.value?.slideToLoop(index);
}
</script>

<style scoped>
.swiper-parent {
  min-width: 100%;
  min-height: 100%;
  position: relative;
}

.swiper-el.md-and-up {
  margin-bottom: -128px !important;
}

.swiper-el.sm-and-up {
  margin-top: -64px;
}

.progress-bar {
  position: absolute;
  z-index: 5;
  top: 0;
  margin-top: 0;
}

.progress-bar.sm-and-up {
  position: relative !important;
  top: initial;
  margin-top: initial;
}
</style>
