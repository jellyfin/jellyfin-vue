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
            variant="outlined"
            width="288">
            <v-img :src="imageFormat(item)" contain width="288" height="162" />
            <div class="text-center text-subtitle-1">{{ item.ImageType }}</div>
            <div class="text-center text-body-2 text--secondary">
              {{ item.Width }} x {{ item.Height }}
            </div>
            <v-card-actions class="justify-center">
              <v-btn icon @click="handleSearch">
                <v-icon>
                  <i-mdi-magnify />
                </v-icon>
              </v-btn>
              <v-btn icon class="ml-3" @click="handleDelete(item)">
                <v-icon>
                  <i-mdi-delete />
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <v-row v-if="backdropImages.length > 0">
      <v-col class="pt-0">
        <h2 class="text-h6">{{ $t('imageType.backdrop') }}</h2>
        <div>
          <v-card
            v-for="(item, i) in backdropImages"
            :key="`${item.ImageTag}-${i}`"
            class="mx-2"
            variant="outlined"
            width="288">
            <v-img :src="imageFormat(item)" contain width="288" height="162" />
            <div class="text-center text-subtitle-1">{{ item.ImageType }}</div>
            <div class="text-center text-body-2 text--secondary">
              {{ item.Width }} &times; {{ item.Height }}
            </div>
            <v-card-actions class="justify-center">
              <v-btn icon @click="handleSearch">
                <v-icon>
                  <i-mdi-magnify />
                </v-icon>
              </v-btn>
              <v-btn icon class="ml-3" @click="handleDelete(item)">
                <v-icon>
                  <i-mdi-delete />
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <image-search
      v-model:dialog="dialog"
      :metadata="metadata"
      @download-success="getItemImageInfos" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  BaseItemDto,
  ImageInfo,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getImageInfo } from '@/utils/images';

export default defineComponent({
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
      return this.images.filter((image) => {
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
        await this.$remote.sdk.newUserApi(getImageApi).getItemImageInfos({
          itemId: this.metadata.Id
        })
      ).data;
    },
    imageFormat(imageInfo: ImageInfo): string | undefined {
      if (imageInfo.ImageType && imageInfo.ImageTag) {
        return getImageInfo(this.metadata, {
          preferThumb: imageInfo.ImageType === ImageType.Thumb,
          preferBanner: imageInfo.ImageType === ImageType.Banner,
          preferLogo: imageInfo.ImageType === ImageType.Logo,
          preferBackdrop: imageInfo.ImageType === ImageType.Backdrop,
          tag: imageInfo.ImageTag
        }).url;
      }
    },
    handleSearch(): void {
      this.dialog = true;
    },
    async handleDelete(item: ImageInfo): Promise<void> {
      if (item.ImageType) {
        await this.$remote.sdk.newUserApi(getImageApi).deleteItemImage({
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
