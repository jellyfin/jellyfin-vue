<template>
  <v-main>
    <v-app-bar
      :class="useResponsiveClasses('app-bar-safe-zone')"
      elevation="0"
      color="transparent">
      <app-bar-button-layout @click="$router.back()">
        <template #icon>
          <v-icon>
            <i-mdi-arrow-left />
          </v-icon>
        </template>
      </app-bar-button-layout>
    </v-app-bar>
    <v-col class="px-0">
      <swiper
        v-if="playbackManager.getQueueItems"
        class="d-flex justify-center align-center"
        :modules="modules"
        :slides-per-view="4"
        centered-slides
        :initial-slide="playbackManager.currentItemIndex || 0"
        :autoplay="false"
        effect="coverflow"
        :coverflow-effect="coverflowEffect"
        keyboard
        a11y
        virtual
        @slide-change="onSlideChange"
        @swiper="setControlledSwiper">
        <swiper-slide
          v-for="(item, index) in playbackManager.getQueueItems"
          :key="`${item.Id}-${index}`"
          :virtual-index="`${item.Id}-${index}`"
          class="d-flex justify-center">
          <div class="album-cover">
            <blurhash-image :item="item" @error="onImageError" />
          </div>
        </swiper-slide>
      </swiper>
      <audio-controls />
    </v-col>
  </v-main>
</template>

<route lang="yaml">
meta:
  layout: fullpage
  backdrop:
    opacity: 0.75
  transition: slideUp
</route>

<script setup lang="ts">
import {
  computed,
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue';
import { ImageType } from '@jellyfin/sdk/lib/generated-client';
import { A11y, Keyboard, Virtual, EffectCoverflow } from 'swiper';
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/keyboard';
import 'swiper/css/effect-coverflow';
import 'swiper/css/virtual';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { isNil } from 'lodash-es';
import { useRoute, useRouter } from 'vue-router';
import { getBlurhash } from '~/utils/images';
import { playbackManagerStore } from '~/store';
import { useResponsiveClasses } from '@/composables';

const modules = [A11y, Keyboard, Virtual, EffectCoverflow];
const route = useRoute();
const router = useRouter();

const playbackManager = playbackManagerStore();
const coverflowEffect = {
  depth: 500,
  slideShadows: false,
  rotate: 0,
  stretch: -400
};

const backdropHash = computed(() => {
  return playbackManager.getCurrentItem
    ? getBlurhash(playbackManager.getCurrentItem, ImageType.Primary)
    : '';
});
const swiperInstance = ref<SwiperType>();
const setControlledSwiper = (swiper: SwiperType): void => {
  swiperInstance.value = swiper;
};

watch(
  () => playbackManager.currentItemIndex,
  () => {
    if (swiperInstance.value && playbackManager.currentItemIndex) {
      swiperInstance.value.slideTo(playbackManager.currentItemIndex);
      route.meta.backdrop.blurhash = backdropHash.value;
      route.meta.title = playbackManager.getCurrentItem?.Name || '';
    } else if (isNil(playbackManager.currentItemIndex)) {
      router.back();
    }
  },
  { immediate: true }
);

onBeforeMount(() => {
  if (isNil(playbackManager.currentItemIndex)) {
    router.replace('/');
  }
});

/**
 * Handle slide changes
 */
function onSlideChange(): void {
  const index = swiperInstance.value?.realIndex || 0;

  if (playbackManager.getQueueItems[index]) {
    playbackManager.setCurrentIndex(index);
  }
}
/**
 * Handle image errors
 */
function onImageError(): void {
  route.meta.backdrop.blurhash = undefined;
}

onMounted(() => {
  playbackManager.setMinimized(false);
});

onUnmounted(() => {
  playbackManager.setMinimized(true);
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
