<template>
  <v-main v-if="playbackManager.queue">
    <v-app-bar color="transparent">
      <app-bar-button-layout @click="$router.back()">
        <template #icon>
          <v-icon>
            <i-mdi-arrow-left />
          </v-icon>
        </template>
      </app-bar-button-layout>
      <v-spacer />
      <app-bar-button-layout @click="isVisualizing = !isVisualizing">
        <template #icon>
          <v-icon>
            <i-dashicons-album v-if="isVisualizing" />
            <i-mdi-chart-bar v-else />
          </v-icon>
        </template>
      </app-bar-button-layout>
    </v-app-bar>
    <v-col class="px-0">
      <v-fade-transition mode="out-in">
        <swiper
          v-if="!isVisualizing"
          class="d-flex justify-center align-center user-select-none"
          :modules="modules"
          :slides-per-view="4"
          centered-slides
          :autoplay="false"
          effect="coverflow"
          :coverflow-effect="coverflowEffect"
          keyboard
          a11y
          virtual
          @slide-change="onSlideChange"
          @swiper="setControlledSwiper">
          <swiper-slide
            v-for="(item, index) in playbackManager.queue"
            :key="`${item.Id}-${index}`"
            :virtual-index="`${item.Id}-${index}`"
            class="d-flex justify-center">
            <div class="album-cover presentation-height">
              <blurhash-image :item="item" />
            </div>
          </swiper-slide>
        </swiper>
        <music-visualizer
          v-else
<<<<<<< HEAD
          class="d-flex justify-center align-center user-select-none presentation-height" />
=======
          class="d-flex justify-center align-center user-select-none"
          style="height: 65vh" />
>>>>>>> 1b7be01f (fix: music visualizer transitions and music hangs)
      </v-fade-transition>
      <v-row class="justify-center align-center mt-3">
        <v-col cols="6">
          <v-row class="justify-center align-center">
            <v-col>
              <v-row>
                <h1 class="text-h4">
                  {{ playbackManager.currentItem?.Name }}
                </h1>
              </v-row>
              <v-row>
                <span class="text-subtitle">
                  {{ artistString }}
                </span>
              </v-row>
            </v-col>
            <!-- TODO: Fix alignment with the end time of TimeSlider -->
            <v-col class="d-flex justify-end">
              <like-button
                v-if="playbackManager.currentItem"
                :item="playbackManager?.currentItem"
                size="x-large" />
            </v-col>
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
import { computed, ref, watch, nextTick } from 'vue';
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
import { useRoute } from 'vue-router';
import { getBlurhash } from '@/utils/images';
import { playbackManagerStore } from '@/store';

const modules = [A11y, Keyboard, Virtual, EffectCoverflow];
const route = useRoute();

const playbackManager = playbackManagerStore();

const coverflowEffect = {
  depth: 500,
  slideShadows: false,
  rotate: 0,
  stretch: -400
};

const isVisualizing = ref(false);

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

watch(isVisualizing, async () => {
  if (!isVisualizing.value) {
    await nextTick();
    swiperInstance.value?.update();
  }
});

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
  min-width: 65vh;
  width: 65vh;
}

.presentation-height {
  height: 65vh;
}
</style>
