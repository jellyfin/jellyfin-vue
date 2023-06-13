<template>
  <v-main>
    <v-app-bar color="transparent">
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
        v-if="playbackManager.queue"
        class="d-flex justify-center align-center user-select-none"
        :modules="modules"
        :slides-per-view="4"
        centered-slides
        :autoplay="false"
        effect="coverflow"
        :coverflow-effect="coverflowEffect"
        a11y
        virtual
        @slide-change="onSlideChange"
        @swiper="setControlledSwiper">
        <swiper-slide
          v-for="(item, index) in playbackManager.queue"
          :key="`${item.Id}-${index}`"
          :virtual-index="`${item.Id}-${index}`"
          class="d-flex justify-center">
          <div class="album-cover">
            <blurhash-image :item="item" />
          </div>
        </swiper-slide>
      </swiper>
      <v-row class="justify-center align-center mt-3">
        <v-col cols="6">
          <v-row class="justify-center align-center">
            <h1 class="text-h4">
              {{ playbackManager.currentItem?.Name }}
            </h1>
          </v-row>
          <v-row class="justify-center align-center">
            <span class="text-subtitle">
              {{ artistString }}
            </span>
          </v-row>
          <v-row class="justify-center align-center mt-3">
            <time-slider />
          </v-row>
          <v-row class="justify-center align-center">
            <shuffle-button size="x-large" />
            <previous-track-button size="x-large" />
            <play-pause-button size="x-large" />
            <next-track-button size="x-large" />
            <repeat-button size="x-large" />
          </v-row>
        </v-col>
      </v-row>
    </v-col>
  </v-main>
</template>

<route lang="yaml">
meta:
  layout: fullpage
  backdrop:
    opacity: 0.75
  transition:
    enter: 'scroll-y-reverse-transition'
    leave: 'scroll-y-transition'
</route>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ImageType } from '@jellyfin/sdk/lib/generated-client';
import { A11y, Virtual, EffectCoverflow } from 'swiper';
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/effect-coverflow';
import 'swiper/css/virtual';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { isNil } from 'lodash-es';
import { useRoute } from 'vue-router';
import { getBlurhash } from '@/utils/images';
import { playbackManagerStore } from '@/store';
import { usePlayerKeys } from '@/composables';

const modules = [A11y, Virtual, EffectCoverflow];
const route = useRoute();

const playbackManager = playbackManagerStore();
const coverflowEffect = {
  depth: 500,
  slideShadows: false,
  rotate: 0,
  stretch: -400
};

usePlayerKeys();

const backdropHash = computed(() => {
  return playbackManager.currentItem
    ? getBlurhash(playbackManager.currentItem, ImageType.Primary)
    : '';
});
const artistString = computed(() =>
  playbackManager.currentItem?.Artists?.join(', ')
);

const swiperInstance = ref<SwiperType>();

/**
 * Sets the swiper Instance
 */
function setControlledSwiper(swiper: SwiperType): void {
  /**
   * Setting the index using initial-slide prop doesn't work properly and triggers
   * the above watcher incorrectly. We set the initial slide here to avoid that.
   */
  if (!isNil(playbackManager.currentItemIndex)) {
    swiper.activeIndex = playbackManager.currentItemIndex;
  }

  swiperInstance.value = swiper;
}

watch(
  backdropHash,
  () => {
    route.meta.backdrop.blurhash = backdropHash.value;
  },
  { immediate: true }
);

watch(
  () => playbackManager.currentItemIndex,
  () => {
    if (swiperInstance.value && !isNil(playbackManager.currentItemIndex)) {
      swiperInstance.value.slideTo(playbackManager.currentItemIndex);
      route.meta.title = playbackManager.currentItem?.Name || '';
    }
  },
  { immediate: true }
);

/**
 * Handle slide changes
 */
function onSlideChange(): void {
  const index = swiperInstance.value?.activeIndex || 0;

  playbackManager.currentItemIndex = index;
}
</script>

<style lang="scss" scoped>
.album-cover {
  position: relative;
  height: 65vh;
  min-width: 65vh;
  width: 65vh;
}
</style>
