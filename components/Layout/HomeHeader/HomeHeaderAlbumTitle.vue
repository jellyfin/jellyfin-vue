<template>
  <div>
    <v-img
      v-if="imageTag"
      max-width="50%"
      max-height="5.5em"
      contain
      position="left center"
      data-swiper-parallax="-300"
      :alt="item.Name"
      :src="logo"
    />
    <h1
      v-else
      data-swiper-parallax="-300"
      class="text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3"
    >
      {{ item.AlbumArtist }}
    </h1>
    <h2 data-swiper-parallax="-200" class="text-h4 text-sm-h3 text-truncate">
      {{ item.Name }}
    </h2>
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
    logo: {
      type: String,
      default: ''
    }
  },
  computed: {
    imageTag(): string | undefined {
      return this.getImageTag(this.item, ImageType.Logo);
    }
  }
});
</script>
