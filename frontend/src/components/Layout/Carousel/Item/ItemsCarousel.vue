<template>
  <Carousel
    progress-bar
    :slides="items.length"
    @on-slide-change="onSlideChange">
    <template #slides>
      <SwiperSlide
        v-for="item in items"
        :key="item.Id"
        :virtual-index="item.Id">
        <div
          :class="useResponsiveClasses('slide-backdrop')"
          data-swiper-parallax="-100">
          <div class="default-icon" />
          <BlurhashImage
            :key="`${item.Id}-image`"
            :item="getRelatedItem(item)"
            :type="ImageType.Backdrop"
            :width="$vuetify.display.mdAndUp ? 256 : 128" />
        </div>
        <div :class="useResponsiveClasses('slide-content')">
          <VContainer
            class="mx-md-10 mt-md-5 py-md-4 align-end align-sm-center align-md-start">
            <VRow>
              <VCol
                cols="12"
                sm="8"
                md="6"
                xl="5"
                class="py-0 py-md-4">
                <p class="text-overline text-truncate mb-2 my-2">
                  <slot name="referenceText" />
                </p>
                <ItemsCarouselTitle :item="item" />
                <MediaInfo
                  :item="item"
                  year
                  tracks
                  runtime
                  rating
                  class="mb-3"
                  data-swiper-parallax="-100" />
                <PlayButton
                  :item="item"
                  data-swiper-parallax="-100" />
                <VBtn
                  min-width="12em"
                  variant="outlined"
                  data-swiper-parallax="-100"
                  :to="getItemDetailsLink(item)">
                  {{ $t('viewDetails') }}
                </VBtn>
              </VCol>
            </VRow>
          </VContainer>
        </div>
      </SwiperSlide>
    </template>
  </Carousel>
</template>

<script setup lang="ts">
import { BaseItemKind, ImageType, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { SwiperSlide } from 'swiper/vue';
import { useRoute } from 'vue-router/auto';
import { useResponsiveClasses } from '@/composables/use-responsive-classes';
import { apiStore } from '@/store/api';
import { getBlurhash } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';

const props = withDefaults(
  defineProps<{
    items: BaseItemDto[];
    pageBackdrop?: boolean;
  }>(),
  { pageBackdrop: false }
);

const route = useRoute();

/**
 * Get the related item passed from the parent component
 */
function getRelatedItem(item: BaseItemDto): BaseItemDto {
  let relatedItem: BaseItemDto | undefined;

  if (item.Type === BaseItemKind.Episode && item.SeriesId) {
    relatedItem = apiStore.getItemById(item.SeriesId);
  } else if (item.Type === BaseItemKind.MusicAlbum && item.AlbumArtists?.[0]?.Id) {
    for (const artist of item.AlbumArtists) {
      const rArtist = apiStore.getItemById(artist.Id);

      if (rArtist) {
        relatedItem = rArtist;
        break;
      }
    }
  } else if (item.ParentLogoItemId) {
    relatedItem = apiStore.getItemById(item.ParentLogoItemId);
  }

  if (relatedItem?.ImageTags?.Backdrop) {
    return relatedItem;
  }

  return item;
}

/**
 * Update page backdrop
 */
function updateBackdrop(index: number): void {
  if (props.pageBackdrop) {
    const hash = getBlurhash(props.items[index], ImageType.Backdrop);

    route.meta.backdrop = { blurhash: hash };
  }
}

/**
 * Handle slide changes
 */
function onSlideChange(index: number): void {
  updateBackdrop(index);
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/Carousel/index.scss';
</style>
