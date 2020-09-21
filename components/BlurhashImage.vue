<template>
  <div ref="card" class="absolute">
    <transition-group mode="in-out" name="fade" class="absolute">
      <blurhash-canvas
        v-if="
          item.ImageBlurHashes &&
          item.ImageBlurHashes.Primary &&
          item.ImageTags &&
          item.ImageTags.Primary
        "
        key="canvas"
        :hash="item.ImageBlurHashes.Primary[item.ImageTags.Primary]"
        :width="width"
        :height="height"
        :punch="punch"
        class="absolute"
      />
      <v-img
        v-if="item.ImageTags && item.ImageTags.Primary"
        key="image"
        class="absolute"
        :src="image"
        v-bind="$attrs"
      />
    </transition-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType } from '~/api';
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
    }
  },
  data() {
    return {
      image: ''
    };
  },
  mounted(): void {
    if (this.item.ImageTags && this.item.ImageTags.Primary) {
      const card = this.$refs.card as HTMLElement;
      this.image = this.getImageUrlForElement(
        card,
        this.item,
        ImageType.Primary
      );
    }
  }
});
</script>

<style>
.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
