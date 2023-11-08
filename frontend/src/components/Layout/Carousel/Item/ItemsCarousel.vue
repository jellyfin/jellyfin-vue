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
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router/auto';
import { SwiperSlide } from 'swiper/vue';
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getBlurhash } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';
import { useRemote, useResponsiveClasses } from '@/composables';

const props = withDefaults(
  defineProps<{
    items: BaseItemDto[];
    pageBackdrop?: boolean;
  }>(),
  { pageBackdrop: false }
);

const relatedItems = ref<{ [k: number]: BaseItemDto }>({});
const route = useRoute();
const remote = useRemote();

/**
 * Get the related item passed from the parent component
 */
function getRelatedItem(item: BaseItemDto): BaseItemDto {
  const rItem = relatedItems.value[props.items.indexOf(item)];

  if (!rItem) {
    return item;
  }

  return rItem;
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

watch(
  props,
  async () => {
    /*
     * TODO: Server should include a ParentImageBlurhashes property, so we don't need to do a call
     * for the parent items. Revisit this once proper changes are done.
     */
    for (const [key, index] of props.items.entries()) {
      let id: string;

      if (index.Type === 'Episode' && index?.SeriesId) {
        id = index.SeriesId;
      } else if (index.Type === 'MusicAlbum' && index?.AlbumArtists?.[0]?.Id) {
        id = index.AlbumArtists[0]?.Id;
      } else if (index?.ParentLogoItemId) {
        id = index.ParentLogoItemId;
      } else {
        continue;
      }

      const itemData = (
        await remote.sdk.newUserApi(getUserLibraryApi).getItem({
          userId: remote.auth.currentUserId ?? '',
          itemId: id
        })
      ).data;

      relatedItems.value[key] = itemData;
    }

    updateBackdrop(0);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@import '@/assets/styles/Carousel/index.scss';
</style>
