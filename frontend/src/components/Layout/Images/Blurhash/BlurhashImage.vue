<template>
  <div ref="imageElement">
    <div v-if="!error">
      <blurhash-canvas
        v-if="hash"
        :hash="hash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute-cover" />
      <v-fade-transition>
        <img
          v-show="!loading"
          class="absolute-cover img"
          :src="image"
          v-bind="$attrs"
          :alt="alt"
          @error="onError"
          @load="loading = false" />
      </v-fade-transition>
    </div>
    <slot v-else name="placeholder">
      <v-icon
        v-if="getItemIcon(item)"
        class="absolute-cover text--disabled"
        :size="iconSize"
        :icon="getItemIcon(item)" />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { useDisplay } from 'vuetify';
import { getBlurhash, getImageInfo } from '~/utils/images';
import { getItemIcon } from '~/utils/items';

const props = defineProps({
  item: {
    type: Object as () => BaseItemDto,
    required: true
  },
  width: {
    type: Number,
    default: 32
  },
  height: {
    type: Number,
    default: 32
  },
  punch: {
    type: Number,
    default: 1
  },
  type: {
    type: String as () => ImageType,
    default: ImageType.Primary
  },
  alt: {
    type: String,
    default: ''
  },
  iconSize: {
    type: String || Number,
    required: false,
    default: '7em'
  }
});

const emit = defineEmits<{
  (e: 'error'): void;
}>();

const display = useDisplay();
const image = ref<string | undefined>('');
const imageElement = ref<HTMLDivElement | undefined>(undefined);
const loading = ref(true);
const error = ref(false);
const hash = computed(() => getBlurhash(props.item, props.type));

/**
 * Error handler
 */
function onError(): void {
  emit('error');
  error.value = true;
}

/**
 * Gets the image URL
 */
function getImage(): void {
  const element = imageElement.value;

  const imageInfo = getImageInfo(props.item, {
    preferThumb: props.type === ImageType.Thumb,
    preferBanner: props.type === ImageType.Banner,
    preferLogo: props.type === ImageType.Logo,
    preferBackdrop: props.type === ImageType.Backdrop,
    width: element?.clientWidth,
    ratio: window.devicePixelRatio || 1
  });

  image.value = imageInfo.url;

  if (!image.value) {
    onError();
  }
}

watch([display.width, display.height, imageElement], () => {
  if (imageElement.value) {
    getImage();
  }
});

watch(props, () => {
  if (imageElement.value) {
    loading.value = true;
    getImage();
  }
});
</script>

<style lang="scss" scoped>
.img {
  color: transparent;
  object-fit: cover;
}
</style>
