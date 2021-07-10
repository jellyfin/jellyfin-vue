<template>
  <div ref="imageElement">
    <div v-if="!error">
      <item-blurhash-canvas
        v-if="hash"
        :hash="hash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute"
      />
      <v-fade-transition>
        <img
          v-show="!loading"
          class="absolute img"
          :src="image"
          v-bind="$attrs"
          :alt="alt"
          @error="onError"
          @load="loading = false"
        />
      </v-fade-transition>
    </div>
    <slot v-else name="placeholder">
      <v-icon class="absolute text--disabled" :size="iconSize">
        {{ getItemIcon(item) }}
      </v-icon>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import { ImageType as ImageTypeEnum } from '@jellyfin/client-axios';
import { computed, defineEmits, nextTick, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useDisplay } from 'vuetify/lib/composables/display';

import { useBaseItem } from '~/composables/items';

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
    default: ImageTypeEnum.Primary
  },
  alt: {
    type: String,
    default: ''
  },
  iconSize: {
    type: String || Number,
    default: '7em'
  }
});

const emit = defineEmits<{ (event: 'error'): void }>();

const display = useDisplay();
const { getImageInfo, getItemIcon } = useBaseItem();

const imageElement: Ref<HTMLImageElement | undefined> = ref();
const image: Ref<string | undefined> = ref('');
const loading = ref(true);
const error = ref(false);
const resetting = ref(false);

const hash = computed(() => {
  return getImageInfo(props.item, {
    preferThumb: props.type === ImageTypeEnum.Thumb,
    preferBanner: props.type === ImageTypeEnum.Banner,
    preferLogo: props.type === ImageTypeEnum.Logo,
    preferBackdrop: props.type === ImageTypeEnum.Backdrop
  }).blurhash;
});

const onError = () => {
  emit('error');
  error.value = true;
};

const getImage = () => {
  nextTick(() => {
    if (imageElement.value) {
      const imageInfo = getImageInfo(props.item, {
        preferThumb: props.type === ImageTypeEnum.Thumb,
        preferBanner: props.type === ImageTypeEnum.Banner,
        preferLogo: props.type === ImageTypeEnum.Logo,
        preferBackdrop: props.type === ImageTypeEnum.Backdrop,
        width: imageElement.value?.clientWidth,
        ratio: window.devicePixelRatio || 1
      });

      image.value = imageInfo.url;

      if (!image.value) {
        onError();
      }
    }
  });
};

const resetImage = (hideImage = true) => {
  const previousUrl = image.value;

  resetting.value = true;

  if (hideImage) {
    loading.value = true;
  }

  error.value = false;
  getImage();

  if (image.value === previousUrl && hideImage) {
    loading.value = false;
  }

  resetting.value = false;
};

watch(
  () => props.item,
  () => {
    resetImage();
  }
);

watch(
  () => props.type,
  () => {
    resetImage();
  }
);

watch([display.width, display.height], () => {
  if (!resetting.value) {
    resetImage(false);
  }
});

onMounted(() => {
  getImage();
});
</script>

<style lang="scss" scoped>
.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.img {
  color: transparent;
  object-fit: cover;
}
</style>
