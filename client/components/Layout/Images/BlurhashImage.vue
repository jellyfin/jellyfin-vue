<template>
  <div ref="imageElement">
    <div v-if="!error" ref="img">
      <blurhash-canvas
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

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [imageHelper, itemHelper],
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
    },
    iconSize: {
      type: String || Number,
      required: false,
      default: '7em'
    }
  },
  data() {
    return {
      image: '' as string | undefined,
      loading: true,
      error: false,
      resetting: false
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
    },
    '$vuetify.breakpoint.width': {
      handler(): void {
        if (!this.resetting) {
          this.resetImage(false);
        }
      }
    },
    '$vuetify.breakpoint.height': {
      handler(): void {
        if (!this.resetting) {
          this.resetImage(false);
        }
      }
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
      this.$nextTick(() => {
        const element = this.$refs.imageElement as HTMLImageElement;

        const imageInfo = this.getImageInfo(this.item, {
          preferThumb: this.type === ImageType.Thumb,
          preferBanner: this.type === ImageType.Banner,
          preferLogo: this.type === ImageType.Logo,
          preferBackdrop: this.type === ImageType.Backdrop,
          width: element?.clientWidth,
          ratio: window.devicePixelRatio || 1
        });

        this.image = imageInfo.url;

        if (!this.image) {
          this.onError();
        }
      });
    },
    resetImage(hideImage = true): void {
      const previousUrl = this.image;

      this.resetting = true;

      if (hideImage) {
        this.loading = true;
      }

      this.error = false;
      this.getImage();

      if (this.image === previousUrl && hideImage) {
        this.loading = false;
      }

      this.resetting = false;
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

.img {
  color: transparent;
  object-fit: cover;
}
</style>
