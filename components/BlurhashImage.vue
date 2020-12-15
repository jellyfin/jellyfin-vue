<template>
  <div v-if="isValidTag()" ref="img">
    <transition-group mode="in-out" name="fade" class="absolute">
      <blurhash-canvas
        v-if="isValidBlurhash()"
        key="canvas"
        :hash="getHash()"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute"
      />
      <img
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
import {
  BaseItemDto,
  BaseItemDtoImageBlurHashes,
  ImageType
} from '@jellyfin/client-axios';
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
    }
  },
  data() {
    return {
      image: ''
    };
  },
  mounted(): void {
    const img = this.$refs.img as HTMLElement;
    this.image = this.getImageUrlForElement(this.item, this.type, img);
  },
  methods: {
    isValidTag(): boolean {
      if (
        (this.item?.ImageTags &&
          Object.prototype.hasOwnProperty.call(
            this.item?.ImageTags,
            this.type
          )) ||
        (this.type === ImageType.Backdrop &&
          this.item?.BackdropImageTags &&
          this.item?.BackdropImageTags.length > 0)
      ) {
        return true;
      } else {
        console.error('Provided tag does not exist in the item');
        return false;
      }
    },
    isValidBlurhash(): boolean {
      if (
        this.item?.ImageBlurHashes &&
        Object.prototype.hasOwnProperty.call(
          this.item?.ImageBlurHashes,
          this.type
        ) &&
        this.type !== ImageType.Backdrop
      ) {
        return true;
      } else if (
        this.type === ImageType.Backdrop &&
        (this.item?.BackdropImageTags as Array<string>).length > 0 &&
        Object.prototype.hasOwnProperty.call(
          this.item?.ImageBlurHashes?.Backdrop,
          (this.item?.BackdropImageTags as Array<string>)[0]
        )
      ) {
        return true;
      } else {
        return false;
      }
    },
    getHash(): string {
      if (this.type === ImageType.Backdrop) {
        const tag = (this.item?.BackdropImageTags as Array<string>)[0];

        return ((this.item?.ImageBlurHashes as BaseItemDtoImageBlurHashes)
          .Backdrop as Record<string, string>)[tag];
      } else {
        return ((this.item?.ImageBlurHashes as BaseItemDtoImageBlurHashes)[
          this.type
        ] as Record<string, string>)[
          (this.item?.ImageTags as Record<string, string>)[this.type]
        ];
      }
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
