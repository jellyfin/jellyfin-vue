<template>
  <div>
    <v-row>
      <v-col class="pt-0">
        <h2 class="text-h6">{{ $t('images') }}</h2>
        <div>
          <v-card
            v-for="(item, i) in generalImages"
            :key="`${item.ImageTag}-${i}`"
            class="ma-2"
            outlined
            width="288"
          >
            <v-img
              :src="imageFormat(item)"
              contain
              width="288"
              height="162"
            ></v-img>
            <div class="text-center subtitle-1">{{ item.ImageType }}</div>
            <div class="text-center body-2 text--secondary">
              {{ item.Width }} x {{ item.Height }}
            </div>
            <v-card-actions class="justify-center">
              <v-btn icon @click="handleSearch">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
              <v-btn icon class="ml-3" @click="handleDelete(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <v-row v-if="backdropImages.length">
      <v-col class="pt-0">
        <h2 class="text-h6">{{ $t('backdrop') }}</h2>
        <div>
          <v-card
            v-for="(item, i) in backdropImages"
            :key="`${item.ImageTag}-${i}`"
            class="mx-2"
            outlined
            width="288"
          >
            <v-img
              :src="imageFormat(item)"
              contain
              width="288"
              height="162"
            ></v-img>
            <div class="text-center subtitle-1">{{ item.ImageType }}</div>
            <div class="text-center body-2 text--secondary">
              {{ item.Width }} &times; {{ item.Height }}
            </div>
            <v-card-actions class="justify-center">
              <v-btn icon @click="handleSearch">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
              <v-btn icon class="ml-3" @click="handleDelete(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <image-search
      :dialog.sync="dialog"
      :metadata="metadata"
      @download-success="getItemImageInfos"
    ></image-search>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageInfo, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    metadata: {
      type: Object,
      default: (): BaseItemDto => ({})
    }
  },
  data() {
    return {
      images: [] as ImageInfo[],
      dialog: false
    };
  },
  computed: {
    generalImages(): boolean {
      return this.$data.images.filter((image: ImageInfo) => {
        return (
          image.ImageType !== ImageType.Screenshot &&
          image.ImageType !== ImageType.Backdrop &&
          image.ImageType !== ImageType.Chapter
        );
      });
    },
    backdropImages(): ImageInfo[] {
      return this.$data.images.filter((image: ImageInfo) => {
        return image.ImageType === ImageType.Backdrop;
      });
    }
  },
  watch: {
    metadata(): void {
      this.getItemImageInfos();
    }
  },
  created() {
    this.getItemImageInfos();
  },
  methods: {
    async getItemImageInfos(): Promise<void> {
      this.images = (
        await this.$api.image.getItemImageInfos({
          itemId: this.metadata.Id
        })
      ).data;
    },
    imageFormat(imageInfo: ImageInfo): string | undefined {
      if (imageInfo.ImageType && imageInfo.ImageTag) {
        return this.getImageUrlForElement(imageInfo.ImageType, {
          itemId: this.metadata.Id,
          tag: imageInfo.ImageTag
        });
      }
    },
    handleSearch(): void {
      this.dialog = true;
    },
    async handleDelete(item: ImageInfo): Promise<void> {
      if (item.ImageType) {
        await this.$api.image.deleteItemImage({
          itemId: this.metadata.Id,
          imageType: item.ImageType,
          imageIndex: item.ImageIndex || 0
        });
      }

      this.getItemImageInfos();
    }
  }
});
</script>
