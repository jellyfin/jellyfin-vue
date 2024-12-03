<template>
  <JOverlay>
    <JImg
      class="uno-h-full uno-w-full"
      :src="imageUrl"
      :alt="item.Name ?? $t('unknown')"
      v-bind="$attrs">
      <template #placeholder>
        <JOverlay>
          <BlurhashCanvas
            v-if="hash"
            :hash="hash"
            :width="width"
            :height="height"
            :punch="punch"
            class="uno-h-full uno-w-full">
            <BlurhashImageIcon
              :item="item"
              class="uno-z--1" />
          </BlurhashCanvas>
          <BlurhashImageIcon
            v-else
            :item="item" />
        </JOverlay>
      </template>
    </JImg>
  </JOverlay>
</template>

<script setup lang="ts">
import {
  type BaseItemDto,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { getBlurhash, getImageInfo } from '#/utils/images';

const { item, width, height, punch, type = ImageType.Primary } = defineProps<{
  item: BaseItemDto | BaseItemPerson;
  width?: number;
  height?: number;
  punch?: number;
  type?: ImageType;
}>();

const imageUrl = computed(() => getImageInfo(item, {
  preferThumb: type === ImageType.Thumb,
  preferBanner: type === ImageType.Banner,
  preferLogo: type === ImageType.Logo,
  preferBackdrop: type === ImageType.Backdrop
}).url);
const hash = computed(() => getBlurhash(item, type));
</script>
