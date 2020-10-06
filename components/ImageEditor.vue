<template>
  <v-list>
    <v-list-item>
      <v-list-item-content>
        <v-card>
          <v-card-title class="headline">{{ $t('images') }}</v-card-title>
          <v-card-text class="d-flex flex-wrap">
            <v-card
              v-for="(item, i) in generalImages"
              :key="i"
              class="ma-2"
              outlined
            >
              <v-img
                :src="imageFormat(item)"
                contain
                class="grey darken-4"
                width="288"
                height="162"
              ></v-img>
              <div class="text-center subtitle-1">{{ item.ImageType }}</div>
              <div class="text-center body-2">
                {{ item.Width }} x {{ item.Height }}
              </div>
              <v-card-actions class="justify-center">
                <v-btn fab x-small @click="handleSearch">
                  <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-btn fab x-small class="ml-3" @click="handleDelete">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
      </v-list-item-content>
    </v-list-item>
    <v-list-item v-if="backdropImages.length">
      <v-list-item-content>
        <v-card>
          <v-card-title class="headline">{{ $t('backdrop') }}</v-card-title>
          <v-card-text class="d-flex flex-wrap">
            <v-card
              v-for="(item, i) in backdropImages"
              :key="i"
              class="mx-2"
              outlined
            >
              <v-img
                :src="imageFormat(item)"
                contain
                class="grey darken-4"
                width="288"
                height="162"
              ></v-img>
              <div class="text-center subtitle-1">{{ item.ImageType }}</div>
              <div class="text-center body-2">
                {{ item.Width }} x {{ item.Height }}
              </div>
              <v-card-actions class="justify-center">
                <v-btn fab x-small @click="handleSearch">
                  <v-icon>mdi-magnify</v-icon>
                </v-btn>
                <v-btn fab x-small class="ml-3" @click="handleDelete">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
      </v-list-item-content>
    </v-list-item>
    <image-search :dialog.sync="dialog" :metadata="metadata"></image-search>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';
import { ImageInfo } from '~/api';

export default Vue.extend({
  props: {
    metadata: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      images: [] as ImageInfo[],
      dialog: false
    };
  },
  computed: {
    generalImages() {
      return this.$data.images.filter((image: ImageInfo) => {
        const { ImageType } = image;
        return (
          ImageType !== 'Screenshot' &&
          ImageType !== 'Backdrop' &&
          ImageType !== 'Chapter'
        );
      });
    },
    backdropImages() {
      return this.$data.images.filter((image: ImageInfo) => {
        const { ImageType } = image;
        return ImageType === 'Backdrop';
      });
    }
  },
  watch: {
    metadata() {
      this.getItemImageInfos();
    }
  },
  created() {
    this.getItemImageInfos();
  },
  methods: {
    async getItemImageInfos() {
      this.images = (
        await this.$imageApi.getItemImageInfos({
          itemId: this.metadata.Id
        })
      ).data;
    },
    imageFormat(imageInfo: ImageInfo) {
      return `${this.$store.state.user.serverUrl}/Items/${this.metadata.Id}/Images/${imageInfo.ImageType}?maxWidth=600&tag=${imageInfo.ImageTag}&quality=90`;
    },
    handleSearch() {
      this.dialog = true;
    },
    handleDelete() {
      console.log(1);
    }
  }
});
</script>
