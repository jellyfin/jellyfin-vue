<template>
  <div v-if="isValidTag()" ref="img" class="absolute">
    <transition-group mode="in-out" name="fade" class="absolute">
      <blurhash-canvas
        v-if="canBeBlurhashed()"
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
        :alt="item.Name"
        @error="onError"
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

const excludedTypes = [ImageType.Logo];

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
    // We don't pass the item itself as we already did all the tags checking in this component,
    // so doing it again in the mixin is useless.
    this.image = this.getImageUrlForElement(this.type, {
      itemId: this.item.Id,
      element: img
    });
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
        this.onError();
        return false;
      }
    },
    canBeBlurhashed(): boolean {
      if (
        excludedTypes.includes(this.type) ||
        (this.item?.ImageBlurHashes as Array<never>).length === 0
      ) {
        return false;
      } else if (
        Object.prototype.hasOwnProperty.call(
          this.item?.ImageBlurHashes,
          this.type
        ) &&
        this.type !== ImageType.Backdrop
      ) {
        return true;
      } else if (
        this.type === ImageType.Backdrop &&
        (this.item?.BackdropImageTags as Array<never>).length > 0 &&
        this.item?.ImageBlurHashes?.Backdrop &&
        Object.prototype.hasOwnProperty.call(
          this.item?.ImageBlurHashes?.Backdrop as Record<string, string>,
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
    },
    onError(): void {
      this.$emit('error');
    }
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

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
