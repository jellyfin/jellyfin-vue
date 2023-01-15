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
          :src="image"
          v-bind="$attrs"
          :alt="alt"
          @load="loading = false"
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
import { computed, ref, watch } from 'vue';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { useDisplay } from 'vuetify';
import { getBlurhash, getImageInfo } from '@/utils/images';
import { getItemIcon } from '@/utils/items';

const props = defineProps({
  item: {
    type: Object as () => BaseItemDto | BaseItemPerson,
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
  }
});

const display = useDisplay();
const image = ref<string | undefined>('');
const loading = ref(true);
const error = ref(false);
const imageElement = ref<HTMLDivElement | undefined>(undefined);
const hash = computed(() => getBlurhash(props.item, props.type));

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
}

watch(hash, () => {
  if (hash.value && !error.value) {
    error.value = false;
  }
});

watch([imageElement, props], () => {
  if (imageElement.value) {
    window.requestAnimationFrame(() => {
      error.value = false;
      getImage();
    });
  }
});

watch([display.width, display.height], () => {
  if (imageElement.value) {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        error.value = false;
        getImage();
      });
    });
  }
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
