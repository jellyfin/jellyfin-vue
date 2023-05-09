<template>
  <div ref="imageElement">
    <div>
      <blurhash-canvas
        v-if="hash"
        v-show="!error"
        :hash="hash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute-cover canvas"
        @error="error = true" />
      <v-fade-transition>
        <img
          v-show="!loading && !error"
          class="absolute-cover img"
          :src="imageUrl"
          v-bind="$attrs"
          :alt="alt"
          @loadstart="
            () => {
              error = false;
              loading = true;
            }
          "
          @load="
            () => {
              error = false;
              loading = false;
            }
          "
          @error="
            () => {
              error = true;
              loading = true;
            }
          " />
      </v-fade-transition>
      <slot
        v-if="$slots.placeholder && (!hash || error)"
        name="placeholder"
        class="placeholder" />
      <v-avatar
        v-else-if="getItemIcon(item) && (!hash || error)"
        :rounded="false"
        size="100%"
        class="absolute-cover d-flex justify-center align-center align-self-center placeholder">
        <v-icon class="text--disabled" size="50%" :icon="getItemIcon(item)" />
      </v-avatar>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, shallowRef, ref } from 'vue';
import { refDebounced } from '@vueuse/core';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { useVuetify } from '@/composables';
import { getBlurhash, getImageInfo } from '@/utils/images';
import { getItemIcon } from '@/utils/items';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const display = useVuetify().display;
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
    alt?: string;
  }>(),
  { width: 32, height: 32, punch: 1, type: ImageType.Primary, alt: '' }
);

const loading = ref(true);
const error = ref(false);
const imageElement = shallowRef<HTMLDivElement>();
const imageUrl = computed(() => {
  const element = imageElement.value;

  /**
   * We want to track the state of those dependencies
   */
  if (
    element &&
    displayWidth.value !== undefined &&
    displayHeight.value !== undefined
  ) {
    const imageInfo = getImageInfo(props.item, {
      preferThumb: props.type === ImageType.Thumb,
      preferBanner: props.type === ImageType.Banner,
      preferLogo: props.type === ImageType.Logo,
      preferBackdrop: props.type === ImageType.Backdrop,
      width: element?.clientWidth,
      ratio: window.devicePixelRatio || 1
    });

    return imageInfo.url;
  }
});

const hash = computed(() => getBlurhash(props.item, props.type));
</script>

<style lang="scss">
.placeholder svg {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss" scoped>
.img {
  color: transparent;
  object-fit: cover;
}

.placeholder {
  z-index: -1;
}
</style>
