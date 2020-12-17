<template>
  <div ref="card" class="absolute">
    <transition-group mode="in-out" name="fade" class="absolute">
      <blurhash-canvas
        v-if="checkImageHash"
        key="canvas"
        :hash="getImageHash"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute"
      />
      <img
        v-if="item.ImageTags && item.ImageTags.Primary"
        key="image"
        class="absolute"
        :src="image"
        v-bind="$attrs"
        @error="$emit('error')"
      />
    </transition-group>
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
    imageType: {
      type: String as () => ImageType,
      required: false,
      default: ImageType.Primary
    }
  },
  data() {
    return {
      image: ''
    };
  },
  computed: {
    checkImageHash(): boolean {
      if (
        (this.imageType === ImageType.Primary &&
          this.item.ImageBlurHashes?.Primary &&
          this.item.ImageTags?.Primary) ||
        (this.imageType === ImageType.Backdrop &&
          this.item.ImageBlurHashes?.Backdrop &&
          this.item.ImageTags &&
          this.item.BackdropImageTags) ||
        (this.imageType === ImageType.Thumb &&
          this.item.ImageBlurHashes?.Thumb &&
          this.item.ImageTags?.Thumb)
      ) {
        return true;
      }
      return false;
    },
    getImageHash(): string {
      switch (this.imageType) {
        case ImageType.Primary:
          if (
            this.item?.ImageTags?.Primary &&
            this.item.ImageBlurHashes?.Primary?.[this.item?.ImageTags?.Primary]
          ) {
            return this.item.ImageBlurHashes?.Primary?.[
              this.item?.ImageTags?.Primary
            ];
          }
          break;
        case ImageType.Thumb:
          if (
            this.item?.ImageTags?.Thumb &&
            this.item.ImageBlurHashes?.Thumb?.[this.item?.ImageTags?.Thumb]
          ) {
            return this.item.ImageBlurHashes?.Thumb?.[
              this.item?.ImageTags?.Thumb
            ];
          }
        // eslint-disable-next-line no-fallthrough
        case ImageType.Backdrop || ImageType.Thumb:
          if (
            this.item?.BackdropImageTags?.[0] &&
            this.item?.ImageBlurHashes?.Backdrop
          ) {
            return this.item?.ImageBlurHashes?.Backdrop?.[
              this.item?.BackdropImageTags?.[0]
            ];
          }
      }
      return '';
    },
    checkImage(): boolean {
      if (
        (this.imageType === ImageType.Primary &&
          this.item.ImageTags &&
          this.item.ImageTags.Primary) ||
        (this.imageType === ImageType.Backdrop &&
          this.item.ImageTags &&
          this.item.BackdropImageTags) ||
        (this.imageType === ImageType.Thumb &&
          this.item.ImageTags &&
          this.item.ImageTags.Thumb)
      ) {
        return true;
      } else return false;
    }
  },
  mounted(): void {
    if (this.checkImage) {
      const card = this.$refs.card as HTMLElement;
      this.image = this.getImageUrlForElement(this.item, this.imageType, card);
    }
  }
});
</script>

<style scoped>
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
  object-fit: cover;
}
</style>
