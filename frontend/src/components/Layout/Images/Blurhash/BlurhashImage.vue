<template>
  <div>
    <JImg
      class="absolute-cover"
      :src="imageUrl"
      :alt="item.Name ?? $t('unknown')"
      v-bind="$attrs">
      <template #placeholder>
        <BlurhashCanvas
          v-if="hash"
          :hash="hash"
          :width="width"
          :height="height"
          :punch="punch"
          class="absolute-cover">
          <BlurhashImageIcon
            :item="item"
            class="uno-z--1" />
        </BlurhashCanvas>
        <BlurhashImageIcon
          v-else
          :item="item" />
      </template>
    </JImg>
  </div>
</template>

<script setup lang="ts">
import {
  type BaseItemDto,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { getBlurhash, getImageInfo } from '@/utils/images';

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
