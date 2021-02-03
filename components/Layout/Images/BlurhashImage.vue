<template>
  <div class="absolute">
    <div v-if="!error" ref="img" class="absolute">
      <blurhash-canvas
        v-if="hash"
        key="canvas"
        :hash="hash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute"
      />
      <v-fade-transition>
        <!-- eslint-disable-next-line vue/html-self-closing -->
        <img
          v-show="!loading"
          :key="`blurhashimage-${item.Id}`"
          class="absolute"
          :src="image"
          v-bind="$attrs"
          :alt="alt"
          @error="onError"
          @load="loading = false"
        />
      </v-fade-transition>
    </div>
    <slot v-else name="placeholder" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
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
    }
  },
  data() {
    return {
      image: '' as string | undefined,
      loading: true,
      error: false
    };
  },
  computed: {
    hash: {
      get(): string | undefined {
        return this.getBlurhash(this.item, this.type);
      }
    }
  },
  watch: {
    item(): void {
      this.resetImage();
    },
    type(): void {
      this.resetImage();
    }
  },
  mounted(): void {
    this.getImage();
  },
  methods: {
    onError(): void {
      this.$emit('error');
      this.error = true;
    },
    getImage(): void {
      const img = this.$refs.img as HTMLElement;
      this.image = this.getImageUrlForElement(this.type, {
        item: this.item,
        element: img
      });
      if (!this.image) {
        this.onError();
      }
    },
    resetImage(): void {
      this.loading = true;
      this.error = false;
      this.getImage();
    }
  }
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

img {
  color: transparent;
  object-fit: cover;
}
</style>
