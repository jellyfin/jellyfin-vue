<template>
  <div
    :class="`swiper-section-${uuid}`"
    style="width: 100%">
    <VCol
      v-show="items && items.length"
      class="swiper-section">
      <div class="d-flex ma-2">
        <h1
          class="text-h6 text-sm-h5 header"
          :class="{ 'header-white-mode': !theme.current.value.dark }">
          <span class="pl-4">{{ title }}</span>
        </h1>
        <VSpacer />
        <VBtn
          class="swiper-prev"
          icon
          variant="plain">
          <VIcon>
            <IMdiArrowLeft />
          </VIcon>
        </VBtn>
        <VBtn
          class="swiper-next"
          icon
          variant="plain">
          <VIcon>
            <IMdiArrowRight />
          </VIcon>
        </VBtn>
      </div>

      <Swiper
        :modules="modules"
        class="swiper"
        :initial-slide="0"
        :free-mode="display.mobile.value"
        effect="slide"
        :navigation="navigation"
        :slides-per-view="slides"
        :slides-per-group="slides"
        :breakpoints="breakpoints"
        a11y>
        <SwiperSlide
          v-for="item in items"
          :key="item.Id"
          :virtual-index="item.Id">
          <ItemCard
            :item="item"
            :shape="shape"
            margin
            text
            overlay
            link />
        </SwiperSlide>
      </Swiper>
    </VCol>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/free-mode';
import 'swiper/css/virtual';
import { A11y, FreeMode, Navigation, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { v4 } from 'uuid';
import { computed } from 'vue';
import { useDisplay, useTheme } from 'vuetify';
import { CardShapes } from '@/utils/items';

const props = defineProps<{
  title: string;
  items: BaseItemDto[];
  shape?: CardShapes;
}>();

const uuid = v4();
const display = useDisplay();
const theme = useTheme();

/**
 * Swiper options
 */
const modules = [Navigation, FreeMode, A11y, Virtual];
const navigation = {
  nextEl: `.swiper-section-${uuid} .swiper-next`,
  prevEl: `.swiper-section-${uuid} .swiper-prev`,
  disabledClass: 'swiper-button-disabled v-btn--disabled'
};
const slides = computed(() => props.shape === CardShapes.Thumb ? 2 : 3);
const breakpoints = computed(() => ({
  600: {
    slidesPerView: props.shape === CardShapes.Thumb ? 3 : 4,
    slidesPerGroup: props.shape === CardShapes.Thumb ? 3 : 4
  },
  960: {
    slidesPerView: props.shape === CardShapes.Thumb ? 3 : 6,
    slidesPerGroup: props.shape === CardShapes.Thumb ? 3 : 6
  },
  1904: {
    slidesPerView: props.shape === CardShapes.Thumb ? 4 : 8,
    slidesPerGroup: props.shape === CardShapes.Thumb ? 4 : 8
  }
}));
</script>

<style scoped>
.swiper-section .header::before {
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
</style>
