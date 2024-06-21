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
import { useRoute } from 'vue-router';
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

    route.meta.layout.backdrop.blurhash = hash;
  }
}

/**
 * Handle slide changes
 */
function onSlideChange(index: number): void {
  updateBackdrop(index);
}
</script>

<style scoped>
.slide-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 2;
}

.slide-content.sm-and-up {
  top: 56px;
}

.slide-backdrop {
  position: relative;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  top: 0;
  padding-bottom: 56.25%;
  background-position: center top;
  background-size: contain;
  background-repeat: no-repeat;
  box-sizing: border-box;
  mask-image: linear-gradient(
    180deg,
    rgba(37, 18, 18, 0.75) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  z-index: 1;
}

.slide-backdrop.sm-and-up {
  width: 80%;
  margin-left: auto;
  margin-right: 0;
  padding-bottom: 45%;
  background-position: right center;
  mask-image: linear-gradient(
      to right,
      hsla(0, 0%, 0%, 0) 0%,
      hsla(0, 0%, 0%, 0.182) 5.6%,
      hsla(0, 0%, 0%, 0.34) 9.9%,
      hsla(0, 0%, 0%, 0.476) 13.1%,
      hsla(0, 0%, 0%, 0.593) 15.7%,
      hsla(0, 0%, 0%, 0.69) 17.9%,
      hsla(0, 0%, 0%, 0.771) 20.2%,
      hsla(0, 0%, 0%, 0.836) 22.9%,
      hsla(0, 0%, 0%, 0.888) 26.3%,
      hsla(0, 0%, 0%, 0.927) 30.8%,
      hsla(0, 0%, 0%, 0.956) 36.7%,
      hsla(0, 0%, 0%, 0.976) 44.4%,
      hsla(0, 0%, 0%, 0.989) 54.3%,
      hsla(0, 0%, 0%, 0.996) 66.6%,
      hsla(0, 0%, 0%, 0.999) 81.7%,
      hsl(0, 0%, 0%) 100%
    ),
    linear-gradient(
      to top,
      hsla(0, 0%, 0%, 0) 0%,
      hsla(0, 0%, 0%, 0.182) 5.6%,
      hsla(0, 0%, 0%, 0.34) 9.9%,
      hsla(0, 0%, 0%, 0.476) 13.1%,
      hsla(0, 0%, 0%, 0.593) 15.7%,
      hsla(0, 0%, 0%, 0.69) 17.9%,
      hsla(0, 0%, 0%, 0.771) 20.2%,
      hsla(0, 0%, 0%, 0.836) 22.9%,
      hsla(0, 0%, 0%, 0.888) 26.3%,
      hsla(0, 0%, 0%, 0.927) 30.8%,
      hsla(0, 0%, 0%, 0.956) 36.7%,
      hsla(0, 0%, 0%, 0.976) 44.4%,
      hsla(0, 0%, 0%, 0.989) 54.3%,
      hsla(0, 0%, 0%, 0.996) 66.6%,
      hsla(0, 0%, 0%, 0.999) 81.7%,
      hsl(0, 0%, 0%) 100%
    );
  mask-composite: intersect;
}
</style>
