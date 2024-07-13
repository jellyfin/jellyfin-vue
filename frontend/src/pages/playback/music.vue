<template>
  <VMain v-if="playbackManager.queue">
    <VAppBar color="transparent">
      <AppBarButtonLayout @click="$router.back()">
        <template #icon>
          <VIcon>
            <IMdiArrowLeft />
          </VIcon>
        </template>
      </AppBarButtonLayout>
      <VSpacer />
      <AppBarButtonLayout @click="isVisualizing = !isVisualizing">
        <template #icon>
          <VIcon>
            <IDashiconsAlbum v-if="isVisualizing" />
            <IMdiChartBar v-else />
          </VIcon>
        </template>
      </AppBarButtonLayout>
    </VAppBar>
    <VCol class="px-0">
      <JTransition mode="out-in">
        <Swiper
          v-if="!isVisualizing"
          class="d-flex justify-center align-center uno-select-none"
          :modules="modules"
          :slides-per-view="4"
          :autoplay="false"
          effect="coverflow"
          :coverflow-effect="coverflowEffect"
          a11y
          centered-slides
          virtual
          @swiper="(swiper) => swiperInstance = swiper"
          @slide-change="onSlideChange">
          <SwiperSlide
            v-for="(item, index) in playbackManager.queue"
            :key="`${item.Id}-${index}`"
            :virtual-index="`${item.Id}-${index}`"
            class="d-flex justify-center">
            <div class="album-cover presentation-height">
              <BlurhashImage :item="item" />
            </div>
          </SwiperSlide>
        </Swiper>
        <MusicVisualizer
          v-else
          class="d-flex justify-center align-center presentation-height uno-select-none" />
      </JTransition>
      <VRow class="justify-center align-center mt-3">
        <VCol cols="6">
          <VRow class="justify-center align-center">
            <VCol>
              <VRow>
                <h1 class="text-h4">
                  {{ playbackManager.currentItem?.Name }}
                </h1>
              </VRow>
              <VRow>
                <span class="text-subtitle">
                  {{ artistString }}
                </span>
              </VRow>
            </VCol>
            <!-- TODO: Fix alignment with the end time of TimeSlider -->
            <VCol class="d-flex justify-end">
              <LikeButton
                v-if="playbackManager.currentItem"
                :item="playbackManager?.currentItem"
                size="x-large" />
            </VCol>
          </VRow>
          <VRow class="justify-center align-center mt-3">
            <TimeSlider />
          </VRow>
          <VRow class="justify-center align-center">
            <ShuffleButton size="x-large" />
            <PreviousTrackButton size="x-large" />
            <PlayPauseButton size="x-large" />
            <NextTrackButton size="x-large" />
            <RepeatButton size="x-large" />
          </VRow>
        </VCol>
      </VRow>
    </VCol>
  </VMain>
</template>

<route lang="yaml">
meta:
  layout:
    name: fullpage
    transition:
      enter: 'slide-y-reverse'
      leave: 'slide-y'
</route>

<script setup lang="ts">
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/effect-coverflow';
import 'swiper/css/keyboard';
import 'swiper/css/virtual';
import { A11y, EffectCoverflow, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { computed, shallowRef, watchEffect } from 'vue';
import { playbackGuard } from '@/plugins/router/middlewares/playback';
import { playbackManager } from '@/store/playback-manager';
import { isNil } from '@/utils/validation';
import { usePlayback } from '@/composables/use-playback';
import { useItemBackdrop } from '@/composables/backdrop';
import { useItemPageTitle } from '@/composables/page-title';

defineOptions({
  beforeRouteEnter: playbackGuard
});

usePlayback();

const modules = [A11y, Virtual, EffectCoverflow];

const coverflowEffect = {
  depth: 500,
  slideShadows: false,
  rotate: 0,
  stretch: -400
};

const isVisualizing = shallowRef(false);
const artistString = computed(() =>
  playbackManager.currentItem?.Artists?.join(', ')
);

const swiperInstance = shallowRef<SwiperType>();

useItemBackdrop(() => playbackManager.currentItem, 0.75);
useItemPageTitle(() => playbackManager.currentItem);

watchEffect(() => {
  if (swiperInstance.value && !isNil(playbackManager.currentItemIndex)) {
    swiperInstance.value.slideTo(playbackManager.currentItemIndex);
  }
}
);

/**
 * Handle slide changes
 */
function onSlideChange(): void {
  const index = swiperInstance.value?.activeIndex ?? 0;

  playbackManager.currentItemIndex = index;
}
</script>

<style scoped>
.album-cover {
  position: relative;
  min-width: 65vh;
  width: 65vh;
}

.presentation-height {
  height: 65vh;
}
</style>
