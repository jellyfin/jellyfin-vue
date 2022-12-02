<template>
  <div :class="`swiper-section-${uuid}`" style="width: 100%">
    <skeleton-home-section v-if="loading" :card-shape="shape" />
    <v-col v-show="items && items.length > 0" class="swiper-section">
      <div class="d-flex ma-2">
        <h1
          class="text-h6 text-sm-h5 font-weight-light header"
          :class="{ 'header-white-mode': !theme.current.value.dark }">
          <span class="pl-4">{{ title }}</span>
        </h1>
        <v-spacer />
        <v-btn
          class="swiper-prev"
          icon
          variant="plain"
          :disabled="
            !swiperInstance || (swiperInstance && swiperInstance.isBeginning)
          ">
          <Icon>
            <i-mdi-arrow-left />
          </Icon>
        </v-btn>
        <v-btn
          class="swiper-next"
          icon
          variant="plain"
          :disabled="
            !swiperInstance || (swiperInstance && swiperInstance.isEnd)
          ">
          <Icon>
            <i-mdi-arrow-right />
          </Icon>
        </v-btn>
      </div>

      <swiper
        :modules="modules"
        class="swiper"
        :initial-slide="0"
        :free-mode="display.mobile.value"
        effect="slide"
        :navigation="navigation"
        :slides-per-view="slidesPerView"
        :slides-per-group="slidesPerGroup"
        :breakpoints="breakpoints"
        a11y
        virtual
        @swiper="setControlledSwiper">
        <swiper-slide
          v-for="item in items"
          :key="item.Id"
          :virtual-index="item.Id">
          <card :shape="cardShape" :item="item" margin text overlay link />
        </swiper-slide>
      </swiper>
    </v-col>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, FreeMode, A11y, Virtual } from 'swiper';
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/virtual';
import { ref } from 'vue';
import { useDisplay, useTheme } from 'vuetify';
import { v4 } from 'uuid';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CardShapes, getShapeFromItemType } from '~/utils/items';

const display = useDisplay();
const theme = useTheme();
const swiperInstance = ref<SwiperType>();
const setControlledSwiper = (swiper: SwiperType): void => {
  swiperInstance.value = swiper;
};

const props = defineProps({
  loading: {
    type: Boolean,
    default(): boolean {
      return false;
    }
  },
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array as () => BaseItemDto[],
    default(): BaseItemDto[] {
      return [];
    }
  },
  shape: {
    type: String,
    default(): string {
      return '';
    }
  }
});

const cardShape = ref<string>(
  props.shape || getShapeFromItemType(props.items?.[0]?.Type)
);
const uuid = v4();

/**
 * Swiper options
 */
const modules = [Navigation, FreeMode, A11y, Virtual];
const navigation = {
  nextEl: `.swiper-section-${uuid} .swiper-next`,
  prevEl: `.swiper-section-${uuid} .swiper-prev`
};
const slidesPerView = props.shape === CardShapes.Thumb ? 2 : 3;
const slidesPerGroup = props.shape === CardShapes.Thumb ? 2 : 3;
const breakpoints = {
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
};
</script>

<style lang="scss" scoped>
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
