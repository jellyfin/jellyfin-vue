<template>
  <div ref="imageElement">
    <JImg
      class="absolute-cover"
      :once
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
            class="z-1" />
        </BlurhashCanvas>
        <BlurhashImageIcon
          v-else
          :item="item" />
      </template>
    </JImg>
  </div>
</template>

<script lang="ts">
import {
  type BaseItemDto,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { refDebounced } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { vuetify } from '@/plugins/vuetify';
import { getBlurhash, getImageInfo } from '@/utils/images';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const display = vuetify.display;
const displayWidth = refDebounced(display.width, 2000);
const displayHeight = refDebounced(display.height, 2000);
</script>

<script setup lang="ts">
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

const imageElement = shallowRef<HTMLDivElement>();
const once = shallowRef(true);
const imageUrl = computed(() => {
  const element = imageElement.value;

  /**
   * We want to track the state of those dependencies
   */
  if (
    element
    && displayWidth.value !== undefined
    && displayHeight.value !== undefined
  ) {
    const imageInfo = getImageInfo(props.item, {
      preferThumb: props.type === ImageType.Thumb,
      preferBanner: props.type === ImageType.Banner,
      preferLogo: props.type === ImageType.Logo,
      preferBackdrop: props.type === ImageType.Backdrop,
      width: element.clientWidth,
      ratio: window.devicePixelRatio || 1
    });

    return imageInfo.url;
  }
});

const hash = computed(() => getBlurhash(props.item, props.type));

/**
 * Needed so item changes pass properly through all the loading states of JImg,
 * but window size changes does it only on first load.
 */
watch(() => props.item, () => once.value = false);
watch([displayWidth, displayHeight], () => once.value = true);
</script>

<style scoped>
.z-1 {
  z-index: -1;
}
</style>
