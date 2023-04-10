<template>
  <h2 class="text-h6">{{ $t('images') }}</h2>
  <v-row>
    <v-col
      v-for="(item, i) in generalImages"
      :key="`${item.ImageTag}-${i}`"
      xl="1"
      lg="3"
      md="4"
      sm="6"
      cols="12">
      <v-card class="ma-2" variant="outlined">
        <v-img
          :src="imageFormat(item)"
          :aspect-ratio="getContainerAspectRatioForImageType(item.ImageType)" />
        <div class="text-center text-subtitle-1">{{ item.ImageType }}</div>
        <div class="text-center text-body-2 text--secondary">
          {{ item.Width }} x {{ item.Height }}
        </div>
        <v-card-actions class="justify-center">
          <v-btn icon @click="onSearch">
            <v-icon>
              <i-mdi-magnify />
            </v-icon>
          </v-btn>
          <v-btn icon class="ml-3" @click="onDelete(item)">
            <v-icon>
              <i-mdi-delete />
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
  <h2 v-if="backdropImages.length > 0" class="text-h6">
    {{ $t('imageType.backdrop') }}
  </h2>
  <v-row v-if="backdropImages.length > 0">
    <v-col
      v-for="(item, i) in backdropImages"
      :key="`${item.ImageTag}-${i}`"
      xl="1"
      lg="3"
      md="4"
      sm="6"
      cols="12">
      <v-card class="ma-2" variant="outlined">
        <v-img
          :src="imageFormat(item)"
          :aspect-ratio="getContainerAspectRatioForImageType(item.ImageType)" />
        <div class="text-center text-subtitle-1">{{ item.ImageType }}</div>
        <div class="text-center text-body-2 text--secondary">
          {{ item.Width }} &times; {{ item.Height }}
        </div>
        <v-card-actions class="justify-center">
          <v-btn icon @click="onSearch">
            <v-icon>
              <i-mdi-magnify />
            </v-icon>
          </v-btn>
          <v-btn icon class="ml-3" @click="onDelete(item)">
            <v-icon>
              <i-mdi-delete />
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
  <image-search
    v-model:dialog="dialog"
    :metadata="metadata"
    @download-success="getItemImageInfos" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  BaseItemDto,
  ImageInfo,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import {
  getContainerAspectRatioForImageType,
  getImageInfo
} from '@/utils/images';
import { useRemote } from '@/composables';

const props = defineProps<{ metadata: BaseItemDto }>();

const remote = useRemote();

const images = ref<ImageInfo[]>([]);
const dialog = ref(false);

const generalImages = computed<ImageInfo[]>(() =>
  images.value.filter(
    (image) =>
      image.ImageType !== ImageType.Screenshot &&
      image.ImageType !== ImageType.Backdrop &&
      image.ImageType !== ImageType.Chapter
  )
);

const backdropImages = computed<ImageInfo[]>(() =>
  images.value.filter((image) => image.ImageType === ImageType.Backdrop)
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

  getItemImageInfos();
}

watch(() => props.metadata, getItemImageInfos, { immediate: true });
</script>
