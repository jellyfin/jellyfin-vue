<template>
  <div>
    <nuxt-link
      v-if="imageTag"
      :to="getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')"
    >
      <v-img
        max-width="50%"
        max-height="5.5em"
        contain
        position="left center"
        data-swiper-parallax="-300"
        :alt="item.Name"
        :src="logo"
      />
    </nuxt-link>
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3"
      :to="getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')"
    >
      {{ item.AlbumArtist }}
    </nuxt-link>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h4 text-sm-h3 text-truncate"
      :to="getItemDetailsLink(item)"
    >
      {{ item.Name }}
    </nuxt-link>
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
