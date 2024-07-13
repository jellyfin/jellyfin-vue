<template>
  <div>
    <JImg
      class="absolute-cover"
      :src="imageUrl"
      :alt="props.item.Name ?? $t('unknown')"
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

const props = withDefaults(
  defineProps<{
    item: BaseItemDto | BaseItemPerson;
    width?: number;
    height?: number;
    punch?: number;
    type?: ImageType;
  }>(),
  { type: ImageType.Primary }
);

const imageUrl = computed(() => getImageInfo(props.item, {
  preferThumb: props.type === ImageType.Thumb,
  preferBanner: props.type === ImageType.Banner,
  preferLogo: props.type === ImageType.Logo,
  preferBackdrop: props.type === ImageType.Backdrop
}).url);
const hash = computed(() => getBlurhash(props.item, props.type));
</script>
