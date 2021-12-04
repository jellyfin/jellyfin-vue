<template>
  <div>
    <nuxt-link v-if="logo.tag && link" :to="link">
      <v-img
        max-width="50%"
        max-height="5.5em"
        contain
        position="left center"
        data-swiper-parallax="-300"
        :alt="item.Name"
        :src="logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else-if="link && textFallback"
      data-swiper-parallax="-300"
      class="link d-block text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3"
      :to="link"
    >
      {{ item.AlbumArtist }}
    </nuxt-link>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper, imageHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    parent: {
      type: Boolean,
      required: false
    },
    textFallback: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      link: '',
      logo: {} as ImageUrlInfo
    };
  },
  beforeMount(): void {
    if (this.parent) {
      switch (this.item.Type) {
        case 'MusicAlbum':
          if (this.item.AlbumArtists?.length) {
            this.link = this.getItemDetailsLink(
              this.item.AlbumArtists[0],
              'MusicArtist'
            );
          }

          break;
        case 'Episode':
          if (this.item.SeriesId) {
            this.link = this.getItemDetailsLink(
              { Id: this.item.SeriesId },
              'Series'
            );
          }

          break;
      }
    } else {
      this.link = this.getItemDetailsLink(this.item);
    }

    this.logo = this.getLogo(this.item);
  }
});
</script>
