<template>
  <h2 class="text-h6">
    {{ $t('images') }}
  </h2>
  <VRow>
    <VCol
      v-for="(item, i) in generalImages"
      :key="`${item.ImageTag}-${i}`"
      xl="1"
      lg="3"
      md="4"
      sm="6"
      cols="12">
      <VCard
        class="ma-2"
        variant="outlined">
        <JImg :src="imageFormat(item)" />
        <div class="text-center text-subtitle-1">
          {{ item.ImageType }}
        </div>
        <div
          v-if="item.Width && item.Height"
          class="text-center text-body-2 text--secondary">
          {{ t('dimensions', { width: item.Width, height: item.Height }) }}
        </div>
        <VCardActions class="justify-center">
          <VBtn
            icon
            @click="onSearch">
            <VIcon>
              <IMdiMagnify />
            </VIcon>
          </VBtn>
          <VBtn
            icon
            class="ml-3"
            @click="onDelete(item)">
            <VIcon>
              <IMdiDelete />
            </VIcon>
          </VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
  <template v-if="backdropImages.length">
    <h2
      class="text-h6">
      {{ $t('backdrop') }}
    </h2>
    <VRow>
      <VCol
        v-for="(item, i) in backdropImages"
        :key="`${item.ImageTag}-${i}`"
        xl="1"
        lg="3"
        md="4"
        sm="6"
        cols="12">
        <VCard
          class="ma-2"
          variant="outlined">
          <JImg :src="imageFormat(item)" />
          <div class="text-center text-subtitle-1">
            {{ item.ImageType }}
          </div>
          <div class="text-center text-body-2 text--secondary">
            {{ t('dimensions', { width: item.Width, height: item.Height }) }}
          </div>
          <VCardActions class="justify-center">
            <VBtn
              icon
              @click="onSearch">
              <VIcon>
                <IMdiMagnify />
              </VIcon>
            </VBtn>
            <VBtn
              icon
              class="ml-3"
              @click="onDelete(item)">
              <VIcon>
                <IMdiDelete />
              </VIcon>
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </template>
  <ImageSearch
    v-model:dialog="dialog"
    :metadata="metadata"
    @download-success="getItemImageInfos" />
</template>

<script setup lang="ts">
import {
  type BaseItemDto,
  type ImageInfo,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { watchImmediate } from '@vueuse/core';
import {
  getImageInfo
} from '@/utils/images';
import { remote } from '@/plugins/remote';

const props = defineProps<{ metadata: BaseItemDto }>();

const images = ref<ImageInfo[]>([]);
const dialog = ref(false);
const { t } = useI18n();

const generalImages = computed<ImageInfo[]>(() =>
  images.value.filter(
    image =>
      image.ImageType !== ImageType.Screenshot
      && image.ImageType !== ImageType.Backdrop
      && image.ImageType !== ImageType.Chapter
  )
);

const backdropImages = computed<ImageInfo[]>(() =>
  images.value.filter(image => image.ImageType === ImageType.Backdrop)
);

/**
 * Fetches image information for the item
 */
async function getItemImageInfos(): Promise<void> {
  if (!props.metadata.Id) {
    return;
  }

  images.value = (
    await remote.sdk.newUserApi(getImageApi).getItemImageInfos({
      itemId: props.metadata.Id
    })
  ).data;
}

/**
 * Get an image url
 */
function imageFormat(imageInfo: ImageInfo): string | undefined {
  if (imageInfo.ImageType && imageInfo.ImageTag) {
    return getImageInfo(props.metadata, {
      preferThumb: imageInfo.ImageType === ImageType.Thumb,
      preferBanner: imageInfo.ImageType === ImageType.Banner,
      preferLogo: imageInfo.ImageType === ImageType.Logo,
      preferBackdrop: imageInfo.ImageType === ImageType.Backdrop,
      tag: imageInfo.ImageTag
    }).url;
  }
}

/**
 * Handles the search action
 */
function onSearch(): void {
  dialog.value = true;
}

/**
 * Removes an image from an item
 */
async function onDelete(item: ImageInfo): Promise<void> {
  if (!props.metadata.Id || !item.ImageType) {
    return;
  }

  await remote.sdk.newUserApi(getImageApi).deleteItemImage({
    itemId: props.metadata.Id,
    imageType: item.ImageType,
    imageIndex: item.ImageIndex ?? undefined
  });

  await getItemImageInfos();
}

watchImmediate(() => props.metadata, getItemImageInfos);
</script>
