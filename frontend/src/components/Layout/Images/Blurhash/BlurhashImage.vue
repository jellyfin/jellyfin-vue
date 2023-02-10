<template>
  <div ref="imageElement">
    <div>
      <blurhash-canvas
        v-if="hash"
        :hash="hash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute-cover canvas"
        @error="error = true" />
      <v-fade-transition>
        <img
          v-show="!loading"
          class="absolute-cover img"
          :src="imageUrl"
          v-bind="$attrs"
          :alt="alt"
          @load="onLoad"
          @error="error = true" />
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

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { useDisplay } from 'vuetify';
import { getBlurhash, getImageInfo } from '@/utils/images';
import { getItemIcon } from '@/utils/items';

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

const display = useDisplay();
const loading = ref(true);
const error = ref(false);
const imageElement = ref<HTMLDivElement | undefined>(undefined);
const imageUrl = computed(() => {
  const element = imageElement.value;

  /**
   * We want to track the state of those dependencies
   */
  if (
    element &&
    display.width.value !== undefined &&
    display.height.value !== undefined
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

/**
 * load event handler
 */
function onLoad(): void {
  window.setTimeout(() => {
    window.requestAnimationFrame(async () => {
      await nextTick(() => {
        loading.value = false;
      });
    });
  });
}

watch(imageUrl, () => {
  loading.value = true;
});

watch([hash, imageUrl], () => {
  error.value = false;
});
</script>

<style lang="scss" scoped>
.img {
  color: transparent;
  object-fit: cover;
}

.placeholder {
  z-index: -1;
}
</style>
